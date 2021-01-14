#!/bin/bash

TIMESTAMP="$(date +%s)"

npm run dev
[[ "$?" -gt 0 ]] && { echo "Failed to build dev package"; exit 1; }
npm run build
[[ "$?" -gt 0 ]] && { echo "Failed to build package"; exit 1; }
 
sed -e "s/TIMESTAMP/$TIMESTAMP/" -e "s/PACKAGE/game/" index-template.html > index.html
sed -e "s/TIMESTAMP/$TIMESTAMP/" -e "s/PACKAGE/game-dev/" index-template.html > index-dev.html

[[ "$?" -gt 0 ]] && { echo "Failed to edit index pages"; exit 1; }

git add .
git commit -m "Publishing build"
git push origin master
