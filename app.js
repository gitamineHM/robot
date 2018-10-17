//////////////////////////////// Dependances ////////////////////////////////////////
var csv = require('csv');
var request = require("request");
var fs = require('fs');
var Papa = require('papaparse');




//////////////////////////////// Paramtetres ////////////////////////////////////////
var SchedDelay = 10; // Minutes
var r = new RegExp('<script type="text\/javascript">' +
                  '([^{]+?({.*profile_pic_url.*})[^}]+?)' +
                   '<\/script>');
var array = []
var csvfile = "account.csv"
var TaskList = [
  'Find_Business_Emails_Instagram'
]
//////////////////////////////// Fonctions ////////////////////////////////////////
const readFile = (path, opts = 'utf8') =>
    new Promise((res, rej) => {
        fs.readFile(path, opts, (err, data) => {
            if (err) rej(err)
            else res(data)
        })
    })

const writeFile = (path, data, opts = 'utf8') =>
    new Promise((res, rej) => {
        fs.writeFile(path, data, opts, (err) => {
            if (err) rej(err)
            else res()
        })
    })

var Email = (username, index) =>
    new Promise((res, rej) => {
      request({uri: "http://www.instagram.com/" + username},
         function(error, response, body) {
           if(error) rej(error)
           else {
             var match = body.match(r)
                 if(match) {
                       var jsonStr = match[2];
                       var business_email = JSON.parse(jsonStr).entry_data.ProfilePage[0].graphql.user.business_email
                       var id = JSON.parse(jsonStr).entry_data.ProfilePage[0].graphql.user.id

                       if(business_email && business_email!='' && business_email!=null)
                       res({ email : business_email, index : index, id:id  })
                       else
                       res(null)
                   }
                   else
                   res(null)
           }
         })
      })

/////////////////////////////// Tâches ///////////////////////////////////////////////
async function Find_Business_Emails_Instagram()
{
  console.log("ROBOT:" + getDate() + ": Lecture du fichier CSV local : " + csvfile )
  var csvString = await readFile(csvfile)
  var results = Papa.parse(csvString);

  //Vérifie que le csv n'est pas vide
  if (results && results.data && results.data.length>0)
  {
    var array = results.data
    // console.log(array)
    var arrayout = await array.map(async function(obj, i) {
           if(obj && obj[0] != null)
           {
                 var b_Email = await Email(obj[0], i)
                 if(b_Email)
                 {
                   // console.log(b_Email)
                   console.log("ROBOT:" + getDate() + ": Email trouvé : " + b_Email.email +" >>> " + obj[0])

                   var c = [obj[0], b_Email.email,b_Email.id]
                   // console.log(c)
                   return c
                   // console.log(array[b_Email.index])

                 }
                 else
                 return [obj[0]]


           }

         })
      Promise.all(arrayout).then(function(values) {
        // console.log(values)
        var csvout = Papa.unparse(values);
        // console.log(csvout)
        writeFile(csvfile, csvout)
        console.log("ROBOT:" + getDate() + ": Ecriture du fichier CSV local : " + csvfile)

        // console.log("Ecriture du fichier CSV local : " + csvfile )

      });


  }

}
//////////////////////////////////////// Routine Principale ////////////////////////////////////
function RunTasks()
{
  TaskList.forEach((obj) => {
    var date = new Date()
    console.log("ROBOT:" + getDate() + ": Exécution de la tâche : " + obj)
    eval(obj)()

  })
}

function getDate()
{
  var date = new Date()
  return date.toISOString().replace('Z', '')
}

function Robot()
{
  RunTasks()
  setInterval(function() {

    RunTasks()

  }, SchedDelay * 60 * 1000);

}

Robot()
