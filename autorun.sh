#!/bin/sh
PROJECTPATH='/Users/ivs/Sources/singing-unicorn-client/'
NODECOMMAND=$(whereis node | awk '{ print $2 }')
FILETOLAUNCH=' gounicorn.js' # the space is important !
LAUNCHCOMMAND=$NODECOMMAND$FILETOLAUNCH
PROJECTNAME='unicorn'

cd $PROJECTPATH
while true; do
if ps ax | grep -v grep | grep '/bin/$PROJECTPATH'
then
echo "found"
else
echo "run"
$LAUNCHCOMMAND
fi
done