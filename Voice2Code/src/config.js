// ------------------------------------------------------------------
// APP CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
    logging: true,
 
    intentMap: {
       'AMAZON.StopIntent': 'END',
    },
 
    db: {
         FileDb: {
             pathToFile: '../db/db.json',
         }
    }
    ,
    cms: {
        GoogleSheetsCMS: {
            spreadsheetId: '1ny0oIC-ppw_ime5T-Gnf1aAF-wXQjeWvR8HH_H_23Us',
            access: 'public',
            sheets: [
                {
                    name: 'responses',
                    type: 'Responses',
                    position: 1,
                },
            ]
        }
    },
 };
 