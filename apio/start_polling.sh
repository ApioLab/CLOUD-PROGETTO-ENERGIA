#!/bin/bash
sudo kill -9 $(ps aux | grep polling.js | awk '{print $2}')
node polling.js
