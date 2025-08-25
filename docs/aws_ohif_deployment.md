cd platform/app
# If routerBasename in config is '/', set it to '/dicom/' first:
gsed -i "s|routerBasename: '/',|routerBasename: '/dicom/',|" public/config/default.js 2>/dev/null || sed -i '' "s|routerBasename: '/',|routerBasename: '/dicom/',|" public/config/default.js

PUBLIC_URL=/dicom/ APP_CONFIG=config/default.js yarn build:viewer
