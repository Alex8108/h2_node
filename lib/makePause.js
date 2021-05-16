
module.exports = async function makePause(amountMs) {
    
    return new Promise((resolve, reject) => {

        setTimeout(() => {
          
          resolve();

        }, amountMs);
      
      });

}