module.exports = function(logic){
	var i= 0;
	var listenPIR = new logic.listenProperty();
	
	var loop= function () {
	    //logica sul PIR
	    
	    listenPIR.set("32","presenza",function(valore){
	        if(valore===1){
	            logic.setProperty("22","r","111111",false,true);
	            logic.setProperty('22','rel1','1',true,false); 
	            logic.setProperty('22','rel2','1',true,false); 
	            logic.setProperty('22','rel3','1',true,false); 
	            logic.setProperty('22','rel4','1',true,false); 
	            logic.setProperty('22','rel5','1',true,false); 
	            logic.setProperty('22','rel6','1',true,false); 
	        }else if(valore===0){
	            setTimeout(function(){
	                if(logic.getProperty("32","presenza")=="0"){
	                    logic.setProperty("22","r","000000",false,true);
	                    logic.setProperty('22','rel1','0',true,false); 
        	            logic.setProperty('22','rel2','0',true,false); 
        	            logic.setProperty('22','rel3','0',true,false); 
        	            logic.setProperty('22','rel4','0',true,false); 
        	            logic.setProperty('22','rel5','0',true,false); 
        	            logic.setProperty('22','rel6','0',true,false); 
	                }
	            },15000);
	        }
	    });
	   
	}
	return loop;
};