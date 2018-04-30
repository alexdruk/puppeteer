const CREDS = require('./creds');

module.exports = {    
    login: async function (browser) {
        for (let index = 0; index < 5; index++) {
            shouldRepeat = false;
            const page = await browser.newPage();
            await page.goto('https://cryptotrader.org');
            await page.setViewport({width: 1280, height: 1000});
            const SIGNIN = '#navbar-container > div.navbar-header.pull-right > ul > li.grey > a'
            await page.click(SIGNIN);
            await page.waitForSelector('#dialog-login').catch(e => {console.log(e);shouldRepeat = true;});
        
            const USERNAME_SELECTOR = '#dialog-login > div > div > div.modal-body > form > div:nth-child(1) > span > input[type="text"]';
            const PASSWORD_SELECTOR = '#dialog-login > div > div > div.modal-body > form > div:nth-child(2) > span > input[type="password"]';
            const BUTTON_SELECTOR = '#dialog-login > div > div > div.modal-body > form > button';
            await page.click(USERNAME_SELECTOR);
            await page.keyboard.type(CREDS.username);
        
            await page.click(PASSWORD_SELECTOR);
            await page.keyboard.type(CREDS.password);
        
            await page.click(BUTTON_SELECTOR);
            await page.waitForSelector('#user_info').catch(e => {console.log(e);shouldRepeat = true;});
            if (!shouldRepeat) {
                console.log('login success')
                break;
            }
         }
    },
    bla:function() {}
};
