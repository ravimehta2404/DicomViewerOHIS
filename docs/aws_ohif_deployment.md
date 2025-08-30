cd platform/app
# If routerBasename in config is '/', set it to '/dicom/' first:
gsed -i "s|routerBasename: '/',|routerBasename: '/dicom/',|" public/config/default.js 2>/dev/null || sed -i '' "s|routerBasename: '/',|routerBasename: '/dicom/',|" public/config/default.js

PUBLIC_URL=/dicom/ APP_CONFIG=config/default.js yarn build:viewer


rsync -avz -e "ssh -i /Users/ravimehta/.ssh/radflare-dicom-server.pem" /Users/ravimehta/Documents/Workspace/study/pacs/dicom_viewer_ohis/platform/app/dist/ ubuntu@65.1.107.198:/opt/ohif-nginx/html/ohif/


# on ec2
sudo nginx -t && sudo systemctl restart nginx
