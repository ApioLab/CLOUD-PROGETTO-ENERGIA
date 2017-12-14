module.exports = function(logic){
	var listenEnergy = new logic.listenProperty();
    var listenPower = new logic.listenProperty();
    var i= 0;
	var energyManager = 0;
	var powerValue = 0;
	var alertEnergy = 0;
	var powerSetPoint = 0;
	
	var energyIntelligence = 0;
	var alertEnergyIntelligence = 0;
	
	var intelligenceAlg = 0;
	var caseEnergy = 0;
	
	var powerChanged = 0;
	
	var lastCaseEnergy = 0;
	
	var loop= function () {
	    
	    listenEnergy.set('18','power',function(valore){
	        /*insert here your code*/
	        logic.setProperty('16','power',String(valore),true,false); 
	    }); 
	    
	    listenPower.set('18','power',function(valore){
	        /*insert here your code*/
	        console.log("E' cambiata la power dell'oggetto 18")
	        if(valore > Number(logic.getProperty('16','setpointpower')) && logic.getProperty('16','onoff') == '1'){
	            console.log("Parte la logica!!!!")
	            if(logic.getProperty('16','luciFrigo') == '1'){
	                
	                logic.setProperty('22','rel2','1'); 
	            } else if(logic.getProperty('16','luciFrigo') == '0'){
	                console.log("Devo spegnere il rel2 del din1")
	                logic.setProperty('22','rel2','0'); 
	            } 
	            if(logic.getProperty('16','luciCasse') == '1'){
	                logic.setProperty('22','rel3','1'); 
	            } else if(logic.getProperty('16','luciCasse') == '0'){
	                logic.setProperty('22','rel3','0'); 
	            } 
	            if(logic.getProperty('16','luciFrutta') == '1'){
	                logic.setProperty('22','rel4','1'); 
	            } else if(logic.getProperty('16','luciFrutta') == '0'){
	                logic.setProperty('22','rel4','0'); 
	            }
	            if(logic.getProperty('16','luciMacelleria') == '1'){
	                logic.setProperty('22','rel5','1'); 
	            } else if(logic.getProperty('16','luciMacelleria') == '0'){
	                logic.setProperty('22','rel5','0'); 
	            }
	            if(logic.getProperty('16','luciCasalinghi') == '1'){
	                logic.setProperty('22','rel6','1'); 
	            } else if(logic.getProperty('16','luciCasalinghi') == '0'){
	                logic.setProperty('22','rel6','0'); 
	            }
	        }
	    }); 
	}
	return loop;
};