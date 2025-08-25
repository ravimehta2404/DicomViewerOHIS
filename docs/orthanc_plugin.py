import orthanc
import requests
import json
import logging
import time
import os
import pickle
import threading
import queue
from abc import ABC, abstractmethod
import datetime

# ===== Configuration =====
CONFIG = {
    # API Connection
    "RADFLARE_API_URL": "http://localhost:8000/api/v1/webhooks/orthanc",
    "API_KEY": "JaMqQQSWbJbLkVHaEbzpfjrncKWwKVtb", #test-key
    "REQUEST_TIMEOUT": 30,  # seconds

    # Queue Configuration
    "QUEUE_TYPE": "persistent",  # Options: "persistent", "rabbitmq"
    "QUEUE_CHECK_INTERVAL": 5,  # seconds

    # Persistent Queue Settings
    "PERSISTENT_QUEUE_PATH": "/Users/ravimehta/Orthanc/Orthanc-MacOS-25.2.0/queue",

    # Retry Logic
    "MAX_RETRIES": 1,
    "INITIAL_RETRY_DELAY": 20,  # seconds
    "MAX_RETRY_DELAY": 60,  # maximum delay between retries
    "RETRY_BACKOFF_FACTOR": 2  # multiply delay by this factor for each retry
}

# ===== Change Type Names =====
CHANGE_TYPE_NAMES = {
    0: "COMPLETED_SERIES",
    1: "DELETED",
    18: "JOB_FAILURE",
    16: "JOB_SUBMITTED",
    17: "JOB_SUCCESS",
    2: "NEW_CHILD_INSTANCE",
    3: "NEW_INSTANCE",
    4: "NEW_PATIENT",
    5: "NEW_SERIES",
    6: "NEW_STUDY",
    10: "ORTHANC_STARTED",
    11: "ORTHANC_STOPPED",
    7: "STABLE_PATIENT",
    8: "STABLE_SERIES",
    9: "STABLE_STUDY",
    12: "UPDATED_ATTACHMENT",
    13: "UPDATED_METADATA",
    15: "UPDATED_MODALITIES",
    14: "UPDATED_PEERS"
}

# Override configurations from environment variables if present
for key in CONFIG:
    env_value = os.environ.get(f"ORTHANC_PLUGIN_{key}")
    if env_value:
        if isinstance(CONFIG[key], int):
            CONFIG[key] = int(env_value)
        elif isinstance(CONFIG[key], bool):
            CONFIG[key] = env_value.lower() in ('true', 'yes', '1')
        else:
            CONFIG[key] = env_value

# ===== Logging Configuration =====
# Create logs directory if it doesn't exist
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(log_dir, exist_ok=True)

# Configure logging to both file and console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, 'orthanc_plugin.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('OrthancPlugin')

# ===== Message Queue Abstract Interface =====
class MessageQueueInterface(ABC):
    @abstractmethod
    def enqueue(self, event_type, payload):
        """Add an event to the queue"""
        pass

    @abstractmethod
    def start(self):
        """Start the queue processing"""
        pass

    @abstractmethod
    def stop(self):
        """Stop the queue processing"""
        pass

# ===== Persistent Queue Implementation =====
class PersistentQueue(MessageQueueInterface):
    """Implements a persistent queue using Python's built-in queue and pickle"""

    def __init__(self, queue_path, api_handler):
        self.api_handler = api_handler
        self.queue_path = queue_path
        self.memory_queue = queue.Queue()
        self.queue_lock = threading.Lock()
        self.processed_events = set()  # Track processed events to prevent duplicates

        try:
            os.makedirs(self.queue_path, exist_ok=True)
            logger.info(f"Queue directory initialized at: {self.queue_path}")
        except Exception as e:
            logger.error(f"Failed to initialize queue directory: {str(e)}")
            raise

        # Load any persisted events
        self._load_persisted_events()

        self.running = False
        self.thread = None

    def enqueue(self, event_type, payload):
        """Add an event to the queue"""
        try:
            # Create a unique event ID based on type and payload
            event_id = f"{event_type}_{payload.get('resource_id', '')}_{payload.get('timestamp', '')}"

            # Skip if we've already processed this event
            if event_id in self.processed_events:
                logger.info(f"Skipping duplicate event: {event_id}")
                return

            event = {
                "id": event_id,
                "type": event_type,
                "payload": payload,
                "retries": 0,
                "timestamp": time.time()
            }
            self.memory_queue.put(event)
            self._persist_event(event)
            logger.info(f"Enqueued event: {event_type} with ID: {event_id}")
        except Exception as e:
            logger.error(f"Failed to enqueue event: {str(e)}")

    def _persist_event(self, event):
        """Persist an event to disk"""
        try:
            with self.queue_lock:
                filename = f"{event['timestamp']}_{event['id']}.pkl"
                filepath = os.path.join(self.queue_path, filename)

                with open(filepath, 'wb') as f:
                    pickle.dump(event, f)
        except Exception as e:
            logger.error(f"Failed to persist event: {str(e)}")

    def _load_persisted_events(self):
        """Load any persisted events from disk"""
        try:
            with self.queue_lock:
                for filename in os.listdir(self.queue_path):
                    if filename.endswith('.pkl'):
                        try:
                            filepath = os.path.join(self.queue_path, filename)
                            with open(filepath, 'rb') as f:
                                event = pickle.load(f)
                                # Skip if we've already processed this event
                                if event['id'] not in self.processed_events:
                                    self.memory_queue.put(event)
                            os.remove(filepath)  # Remove after loading
                            logger.info(f"Loaded persisted event: {event['type']} with ID: {event['id']}")
                        except Exception as e:
                            logger.error(f"Error loading event {filename}: {str(e)}")
        except Exception as e:
            logger.error(f"Failed to load persisted events: {str(e)}")

    def _process_queue(self):
        """Process the queue continuously"""
        while self.running:
            try:
                # Process in-memory queue
                try:
                    event = self.memory_queue.get(block=True, timeout=CONFIG["QUEUE_CHECK_INTERVAL"])
                    success = self._process_event(event)

                    if success:
                        # Mark event as processed only if successful
                        self.processed_events.add(event['id'])
                        logger.info(f"Successfully processed event: {event['type']} with ID: {event['id']}")
                    elif event["retries"] < CONFIG["MAX_RETRIES"]:
                        event["retries"] += 1
                        # Calculate exponential backoff delay
                        delay = min(
                            CONFIG["INITIAL_RETRY_DELAY"] * (CONFIG["RETRY_BACKOFF_FACTOR"] ** (event["retries"] - 1)),
                            CONFIG["MAX_RETRY_DELAY"]
                        )
                        logger.warning(f"Retrying event {event['type']} with ID: {event['id']} (attempt {event['retries']}/{CONFIG['MAX_RETRIES']}) after {delay} seconds")
                        time.sleep(delay)
                        self.memory_queue.put(event)
                        self._persist_event(event)
                    else:
                        logger.error(f"Failed to process event after {CONFIG['MAX_RETRIES']} retries: {event['type']} with ID: {event['id']}")
                        # Mark as processed to prevent further retries
                        self.processed_events.add(event['id'])
                except queue.Empty:
                    # No events in memory queue, look for persisted events
                    self._load_persisted_events()

                time.sleep(1)  # Prevent busy-waiting
            except Exception as e:
                logger.error(f"Error in queue processing: {str(e)}")
                time.sleep(5)

    def _process_event(self, event):
        """Process a single event"""
        try:
            return self.api_handler.send_webhook(event["type"], event["payload"])
        except Exception as e:
            logger.error(f"Error processing event: {str(e)}")
            return False

    def start(self):
        """Start the queue processing thread"""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._process_queue, daemon=True)
            self.thread.start()
            logger.info("Started persistent queue processing")

    def stop(self):
        """Stop the queue processing thread"""
        if self.running:
            logger.info("Stopping persistent queue processing")
            self.running = False
            if self.thread and self.thread.is_alive():
                self.thread.join(timeout=5)
            logger.info("Persistent queue processing stopped")

# ===== API Handler =====
class RadflareApiHandler:
    """Handles communication with the Radflare API"""

    def send_webhook(self, endpoint, payload):
        """Send webhook to RadFlare API with retry logic"""
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": CONFIG["API_KEY"]
        }

        logger.info(f"---- SEND_WEBHOOK called, PAYLOAD: {payload}")

        retries = 0
        while retries < CONFIG["MAX_RETRIES"]:
            try:
                url = f"{CONFIG['RADFLARE_API_URL']}/{endpoint}"
                response = requests.post(
                    url,
                    json=payload,
                    headers=headers,
                    timeout=CONFIG["REQUEST_TIMEOUT"]
                )

                if response.status_code >= 200 and response.status_code < 300:
                    logger.info(f"Successfully sent webhook to {endpoint}")
                    return True
                else:
                    logger.error(f"Failed to send webhook: {response.status_code} - {response.text}")
                    retries += 1
                    if retries < CONFIG["MAX_RETRIES"]:
                        time.sleep(CONFIG["INITIAL_RETRY_DELAY"])
                    continue

            except requests.Timeout:
                logger.error(f"Timeout sending webhook to {endpoint}")
                retries += 1
                if retries < CONFIG["MAX_RETRIES"]:
                    time.sleep(CONFIG["INITIAL_RETRY_DELAY"])
                continue
            except requests.ConnectionError:
                logger.error(f"Connection error sending webhook to {endpoint}")
                retries += 1
                if retries < CONFIG["MAX_RETRIES"]:
                    time.sleep(CONFIG["INITIAL_RETRY_DELAY"])
                continue
            except requests.RequestException as e:
                logger.error(f"Request error sending webhook: {str(e)}")
                retries += 1
                if retries < CONFIG["MAX_RETRIES"]:
                    time.sleep(CONFIG["INITIAL_RETRY_DELAY"])
                continue
            except Exception as e:
                logger.error(f"Unexpected error sending webhook: {str(e)}")
                return False  # Don't retry unexpected errors

        logger.error(f"Failed to send webhook after {CONFIG['MAX_RETRIES']} retries")
        return False

# ===== Orthanc Event Handler =====
class OrthancEventHandler:
    """Handles Orthanc events and forwards them to the message queue"""

    def __init__(self, message_queue):
        self.message_queue = message_queue

    def handle_change(self, change_type, resource_type, resource_id):
        """Handle Orthanc change events"""
        change_type_name = CHANGE_TYPE_NAMES.get(change_type, f"UNKNOWN_{change_type}")
        # logger.info(f"handle_change hit, change Type: {change_type} ({change_type_name}) resource_type: {resource_type} resource_id: {resource_id}")
        # print(f"OnChange CALLBACK hit, change Type: {change_type} ({change_type_name}) resource_type: {resource_type} resource_id: {resource_id}")

        try:
            # Handle Orthanc lifecycle events first
            if change_type == orthanc.ChangeType.ORTHANC_STARTED:
                logger.info("Orthanc started - starting message queue")
                self.message_queue.start()
                return

            elif change_type == orthanc.ChangeType.ORTHANC_STOPPED:
                logger.info("Orthanc stopped - stopping message queue")
                self.message_queue.stop()
                return

            # Handle DICOM events in order of occurrence:
            # 1. NEW_STUDY: When a new study is received
            # 2. NEW_INSTANCE: When new instances are added to a study
            # 3. STABLE_STUDY: When a study is complete and stable
            if change_type == orthanc.ChangeType.NEW_STUDY:
                logger.info(f"New study received: {resource_id}")
                payload = {
                    "resource_id": resource_id,
                    "timestamp": datetime.datetime.now().isoformat()
                }
                self.message_queue.enqueue("study-created", payload)

            elif change_type == orthanc.ChangeType.STABLE_STUDY:
                logger.info(f"Study marked as stable: {resource_id}")
                payload = {
                    "resource_id": resource_id,
                    "timestamp": datetime.datetime.now().isoformat()
                }
                self.message_queue.enqueue("study-completed", payload)

            elif change_type == orthanc.ChangeType.DELETED:
                # Only send webhook if a study is deleted, not for instances or series
                if resource_type == 1: # 1 is the code for a study in Orthanc - Enumeration value STUDY: 1
                    logger.info(f"Study deleted from Orthanc: {resource_id}")
                    payload = {
                        "resource_id": resource_id,
                        "timestamp": datetime.datetime.now().isoformat()
                    }
                    self.message_queue.enqueue("study-deleted", payload)
                return


        except Exception as e:
            logger.error(f"Error handling Orthanc event: {str(e)}")

# ===== Main Plugin Initialization =====
def initialize_plugin():
    try:
        api_handler = RadflareApiHandler()
        message_queue = PersistentQueue(CONFIG["PERSISTENT_QUEUE_PATH"], api_handler)
        event_handler = OrthancEventHandler(message_queue)
        orthanc.RegisterOnChangeCallback(event_handler.handle_change)

        logger.info("RadFlare integration plugin initialized successfully")
        print("Python - RadFlare integration plugin initialized successfully")
        return True

    except Exception as e:
        logger.error(f"Failed to initialize plugin: {str(e)}")
        return False

# Initialize the plugin when loaded
initialize_plugin()
