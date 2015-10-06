require('cloud/app.js');
//require('cloud/controllers/parseAll.js');
//
//Parse.Cloud.job("updateAll", function(request, status){
//    Parse.Cloud.useMasterKey();
//
//     Parse.Cloud.run("parseAllFile").then(function(result){
//        if (result == true){
//          status.success("Migration completed successfully.");
//        }  else {
//        status.error("Uh oh, something went wrong.");
//		}
//	})
//});