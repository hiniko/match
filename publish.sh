#!/bin/bash

TIMESTAMP="$(date +%s)"
 
sed -e "s/TIMESTAMP/$TIMESTAMP/" -e "s/PACKAGE/game/" index-template.html > index.html
sed -e "s/TIMESTAMP/$TIMESTAMP/" -e "s/PACKAGE/game-dev/" index-template.html > index-dev.html

[[ "$?" -gt 0 ]] && { echo "Failed to edit index pages"; exit 1; }

git add .
git commit -m "Publishing build"
git push origin master
