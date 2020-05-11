'use strict';

const { app, BrowserWindow } = require('electron');
const express = require('express');
const cors = require('cors');
const path = require('path');
const dns = require('dns');
const fs = require('fs');

const api = express();
const port = process.env.PORT || 3000;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

api.use(cors());

api.get('/api', (req, res) => {
    const url = req.query.url != undefined && req.query.url.length > 0 ? req.query.url.replace(/^https?:\/\//i, '') : 'null';
    const domain = url != 'null' ? url.split('/')[0] : 'undefined';
    
    dns.lookup(domain, (error, addresses, family) => {
        if(error) {            
            console.log('URL invalid: ' + url);
            return res.json({error: 'URL invalid: ' + url});
        } else {
            console.log('URL: ' + url);
            const hash = Math.random().toString(36).substring(2);
            console.log('PDF hash: ' + hash);
            const target = path.join(__dirname,'pdfs',hash + '.pdf');
            console.log('PDF path: ' + target);          

            app.allowRendererProcessReuse = true;
            const window = new BrowserWindow({show : false});
            window.loadURL('http://' + url);                          
            const option = {
                landscape: req.query.vertical == 'true' ? false : true,
                marginsType: 1,
                printBackground: true,
                printSelectionOnly: false,
                pageSize: 'A4',
            };
            window.webContents.on('did-finish-load', async () => {
                await sleep(parseInt(req.query.seconds) > 0 ? parseInt(req.query.seconds) * 1000 : 1000);

                window.webContents.printToPDF(option).then(data => {
                  fs.writeFile(target, data, (error) => {
                    if (error) throw error;
                    return res.sendFile(target);
                  });
                }).catch(error => {
                    console.log('PDF error: ' + error);
                    return res.json({error: 'PDF error: ' + error});
                });
            });
        };
    });
});
    
api.listen(port, () => {
    console.log('Node.js listening on port: ' + port);
});