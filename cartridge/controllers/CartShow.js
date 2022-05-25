'use strict';

/**
Controller that redirects the user to cart or login page depending on the login status of the current user
 *
 * @module controllers/CartShow
 */

/* API Includes */
var ArrayList = require('dw/util/ArrayList');
var ISML = require('dw/template/ISML');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Invalidates the login and shipment forms. Renders the checkout/cart/cart template.
 */
/*This function is for rendering cart only when user is logged in else it will show login page*/
function show() {
    if (customer.registered) {
        var cartForm = app.getForm('cart');
        app.getForm('login').invalidate();

        cartForm.get('shipments').invalidate();
    
        app.getView('Cart', {
            cart: app.getModel('Cart').get(),
            RegistrationStatus: false
        }).render('checkout/cart/cart');
    }
    else{   
        var pageMeta = require('~/cartridge/scripts/meta');
        var ContentMgr = dw.content.ContentMgr;
        var content = ContentMgr.getContent('myaccount-login');
        var loginForm = app.getForm('login');
        var loginView = app.getView('Login',{
            RegistrationStatus: false
        });
    
        loginForm.clear();

        if (content) {
            pageMeta.update(content);
        }
    
        loginView.template = 'account/login/accountlogin';
        loginView.render();
    }
    
}


/*
* Module exports
*/

/** Invalidates the login and shipment forms. Renders the basket content.
 * @see {@link module:controllers/CartShow~show} */
exports.Show = guard.ensure(['https'], show);

