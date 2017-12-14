module.exports = function(logic){
	var listenDimmerLedUfficio = new logic.listenProperty();
    var listenOnoffLedUfficio = new logic.listenProperty();
    var i= 0;
	var listen1 = new logic.listenProperty();
	var listen2 = new logic.listenProperty();
	var dimmer = -1;
	var listenEnoceanRocker = new logic.listenProperty();
	var loop= function () {
	    
	   listenOnoffLedUfficio.set('35','onoff',function(valore){
	       /*insert here your code*/
	       if(dimmer === -1 || dimmer !== 2){
	           dimmer = 1;
    	       if(valore === 0){
    	            logic.setProperty('22','dac1','0');
    	            logic.setProperty('35','dimmer','0',true,false);
    	        } else if(valore === 1) {
    	           logic.setProperty('22','dac1','65535');
    	           logic.setProperty('35','dimmer','65535',true,false);
    	        }
	       } else {
	           dimmer = -1;
	       }
	   });
	   listenEnoceanRocker.set("27","onoff",function(valore){
	        if(logic.getProperty("22","dac1") == "0"){
	            logic.setProperty("35","onoff","1",true,false);
	        } else if(logic.getProperty("22","dac1") == "65535"){
	            logic.setProperty("35","onoff","0",true,false);
	        }
	    });
	   listenDimmerLedUfficio.set('35','dimmer',function(valore){
	       /*insert here your code*/
	       if(dimmer === -1 || dimmer !== 1){
	           dimmer = 2;
    	       if(valore === 0){
    	           logic.setProperty('35','onoff','0',true,false);
    	       } else if(valore !== 0){
    	           logic.setProperty('35','onoff','1',true,false);
    	       }
    	       logic.setProperty('22','dac1',String(valore));
	       } else {
	           dimmer = -1;
	       }
	   }); 
	}
	return loop;
};