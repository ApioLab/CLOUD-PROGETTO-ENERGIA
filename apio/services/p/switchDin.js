module.exports = function(logic){
	var listenDIN1 = new logic.listenProperty();
	var listenDIN2 = new logic.listenProperty();
	var listenDIN3 = new logic.listenProperty();
	var listenDIN4 = new logic.listenProperty();
	var listenDIN5 = new logic.listenProperty();
	var listenDIN6 = new logic.listenProperty();
	
	
    var listenEnoceanRocker = new logic.listenProperty();
	var listenEnoceanRocker1 = new logic.listenProperty();
	var incrementoDimmer = null;
	var decrementoDimmer;
	var loop= function () {
	    listenDIN1.set('22','din1',function(valore){
	        /*insert here your code*/
	        if(logic.getProperty('22','rel1') == '1'){
	            logic.setProperty('22','rel1','0'); 
	        } else if(logic.getProperty('22','rel1') == '0'){
	            logic.setProperty('22','rel1','1'); 
	        }
	    });
	    listenDIN2.set('22','din2',function(valore){
	        /*insert here your code*/
	        if(logic.getProperty('22','rel2') == '1'){
	            logic.setProperty('22','rel2','0'); 
	        } else if(logic.getProperty('22','rel2') == '0'){
	            logic.setProperty('22','rel2','1'); 
	        }
	    });
	    listenDIN3.set('22','din3',function(valore){
	        /*insert here your code*/
	        if(logic.getProperty('22','rel3') == '1'){
	            logic.setProperty('22','rel3','0'); 
	        } else if(logic.getProperty('22','rel3') == '0'){
	            logic.setProperty('22','rel3','1'); 
	        }
	    });
	    listenDIN4.set('22','din4',function(valore){
	        /*insert here your code*/
	        if(logic.getProperty('22','rel4') == '1'){
	            logic.setProperty('22','rel4','0'); 
	        } else if(logic.getProperty('22','rel4') == '0'){
	            logic.setProperty('22','rel4','1'); 
	        }
	    });
	    listenDIN5.set('22','din5',function(valore){
	        /*insert here your code*/
	        if(logic.getProperty('22','rel5') == '1'){
	            logic.setProperty('22','rel5','0'); 
	        } else if(logic.getProperty('22','rel5') == '0'){
	            logic.setProperty('22','rel5','1'); 
	        }
	    });
	    listenDIN6.set('22','din6',function(valore){
	        /*insert here your code*/
	        if(logic.getProperty('22','rel6') == '1'){
	            logic.setProperty('22','rel6','0'); 
	        } else if(logic.getProperty('22','rel6') == '0'){
	            logic.setProperty('22','rel6','1'); 
	        }
	    });
	    
	}
	return loop;
};