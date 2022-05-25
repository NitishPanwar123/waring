'use strict';

/* API Includes */
var Cart = require('~/cartridge/scripts/models/CartModel');
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var app = require('~/cartridge/scripts/app');
var XiSecure = require('*/cartridge/scripts/payment/processor/XiSecurePaypal.ds');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');
var BasketMgr = require('dw/order/BasketMgr');
var currentSite = require('dw/system/Site').getCurrent();
var amount ;
var Token ;


 function decodeFormParams(params) {
    var pairs = params.split('&'),
        result = {};

    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('='),
            key = decodeURIComponent(pair[0]),
            value = decodeURIComponent(pair[1]),
            isArray = /\[\]$/.test(key),
            dictMatch = key.match(/^(.+)\[([^\]]+)\]$/);

        if (dictMatch) {
            key = dictMatch[1];
            var subkey = dictMatch[2];

            result[key] = result[key] || {};
            result[key][subkey] = value;
        } else if (isArray) {
            key = key.substring(0, key.length - 2);
            result[key] = result[key] || [];
            result[key].push(value);
        } else {
            result[key] = value;
        }
    }

    return result;
}

 function DoExpressCheckoutPayment(Token,amount,PayerID){
   var callMethod = 'DoExpressCheckoutPayment';
   var TRANSACTIONID = '';
   var getTransId = LocalServiceRegistry.createService('paypal-nvp', {
   createRequest: function (svc, args) {
       var url = svc.getConfiguration().getCredential().getURL();
       svc.setRequestMethod('POST');
       svc.setURL(url);
       svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
       var payload ="USER="+ currentSite.getCustomPreferenceValue('PP_API_Merchant_Username') +
                    "&PWD="+ currentSite.getCustomPreferenceValue('PP_API_Merchant_Password') +
                    "&SIGNATURE="+currentSite.getCustomPreferenceValue('PP_API_Merchant_Signature') +
                    "&METHOD="+ callMethod +
                    "&VERSION=78&TOKEN="+ Token +
                    "&PayerID="+ PayerID +
                    "&PAYMENTREQUEST_0_PAYMENTACTION="+currentSite.getCustomPreferenceValue('PP_API_ExpressPaymentAction').getValue()+
                    "&PAYMENTREQUEST_0_AMT="+ amount +
                    "&PAYMENTREQUEST_0_CURRENCYCODE="+session.getCurrency().getCurrencyCode()+
                    "&BUTTONSOURCE=Paymetric_SP";
       return payload;
   },
   parseResponse: function (svc, output) {
        var output = output.text;
        TRANSACTIONID = decodeFormParams(output.toString()).PAYMENTINFO_0_TRANSACTIONID.toString();
       return output;
   }
});

getTransId.call();
return TRANSACTIONID;
}

function Handle(args) {
    var cart = Cart.get(args.Basket);
    var basket= BasketMgr.getCurrentBasket();
    Transaction.wrap(function () {
        cart.removeExistingPaymentInstruments('PayPal');
        cart.createPaymentInstrument('PayPal', cart.getNonGiftCertificateAmount());
    });
        try{
             if(basket.custom.session_token!=null||basket.custom.session_token!=''){
             return {success: true};
        }
        }catch(ex){
        return {error: true, errorMessage: ex.message};
        }
     return {success: true};
}

/**
 * Authorizes a payment using a credit card. The payment is authorized by using the PAYPAL_EXPRESS processor only
 * and setting the order no as the transaction ID. Customizations may use other processors and custom logic to
 * authorize credit card payment.
 */
 function Authorize(args){
    var OrderMgr = require('dw/order/OrderMgr');
    var order=OrderMgr.getOrder(args.Order.orderNo);
    var transId = DoExpressCheckoutPayment(order.custom.session_token,Number((order.custom.OrderTotal).split(" ")[1]),order.custom.session_payerid);
    Transaction.wrap(function () {
        order.paymentInstrument.custom.paypalPayerID = order.custom.session_payerid;
        order.paymentInstrument.custom.paypalToken = order.custom.session_token;
        order.paymentInstrument.custom.paypalTransactionID = transId;
        //order.custom.PaypalTransaction=transId; // store transaction id
    });
var orderObj = args.Order;
var paymentInstrument = args.Order.getPaymentInstruments()[0];
var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
try{
    var hasToken = !empty(paymentInstrument.creditCardToken);
    if (empty(args.Order)) {
        var errorMessage = 'XiPay.js [Authorize] Cannot find order with number: ';
        Logger.error(errorMessage);
        return { fieldErrors: [], serverErrors: [errorMessage], error: true };
    }
        var authorizeResult = XiSecure.authorize(args.Order, null);
        if(authorizeResult.ok){
            var resultObject=authorizeResult.object;
            resultObject.ignoreCVV=!hasToken;
            try{
                XiSecure.checkAuthorizeCodes(resultObject);
            }catch(e){
                return {authorized: false, error: true, errorMessage: e.message};
            }
            dw.system.Logger.warn('Request Send Data 31 -:');
            Transaction.wrap(function(){
                paymentInstrument.paymentTransaction.transactionID=resultObject.TransactionID;
                paymentInstrument.paymentTransaction.custom.authorizationCode=resultObject.AuthorizationCode;
                paymentInstrument.paymentTransaction.custom.AVSstreetOK=resultObject.AVSstreetOK;
                paymentInstrument.paymentTransaction.custom.AVSzipOK=resultObject.AVSzipOK;
                paymentInstrument.paymentTransaction.custom.CVVOK=resultObject.CVVOK;
                paymentInstrument.paymentTransaction.custom.callStatus = 'C';
                paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            });
        }else if("ERROR"===authorizeResult.status || 'SERVICE_UNAVAILABLE'===authorizeResult.status){
            return {authorized: false, error: true, errorMessage: authorizeResult.errorMessage};
        }
        return {authorized: true};
    }catch(ex){
        return {authorized: false, error: true, errorMessage: ex.message};
    }
}
exports.Handle = Handle;
exports.Authorize = Authorize;
