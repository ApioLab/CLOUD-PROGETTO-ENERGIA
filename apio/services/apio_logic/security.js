module.exports = function(logic){
	var presenza = new logic.listenProperty();
    var finestra = new logic.listenProperty();
    var porta = new logic.listenProperty();
    var all = new logic.listenProperty();
    var i= 0;
    var alarm = false;
	var loop= function () {
	    all.set('34','attivo',function(valore){
	        /*insert here your code*/
	        if(valore==1){
	            alarm = true;
	        } else {
	            alarm = false;
	            logic.setProperty('26','switch','0');
	            logic.setProperty('33','switch','0');
	        }
	    });
	    porta.set('28','porta',function(valore){
	        /*insert here your code*/
	        if(alarm && valore==1){
	            logic.setProperty('26','switch','1');
	            logic.setProperty('33','switch','1'); 
	        } else if(alarm && valore==0){
	            logic.setProperty('26','switch','0');
	            logic.setProperty('33','switch','0');
	        }
	    }); 
	    finestra.set('29','porta',function(valore){
	        /*insert here your code*/
	        if(alarm && valore==1){
	            logic.setProperty('26','switch','1');
	            logic.setProperty('33','switch','1'); 
	        } else if(alarm && valore==0){
	            logic.setProperty('26','switch','0');
	            logic.setProperty('33','switch','0');
	        }
	    }); 
	    presenza.set('32','presenza',function(valore){
	        /*insert here your code*/
	        if(alarm && valore==1){
	            logic.setProperty('26','switch','1');
	            logic.setProperty('33','switch','1'); 
	        } else if(alarm && valore==0){
	            logic.setProperty('26','switch','0');
	            logic.setProperty('33','switch','0');
	        }
	    }); 
	}
	return loop;
};