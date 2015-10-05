var JSZip = require("cloud/lib/jszip");

var encodings= {
    // Windows code page 1252 Western European
    //
    cp1252: '\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\x0c\r\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f\u20ac\ufffd\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\ufffd\u017d\ufffd\ufffd\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\ufffd\u017e\u0178\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff',

    // Windows code page 1251 Cyrillic
    //
    cp1251: '\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\x0c\r\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f\u0402\u0403\u201a\u0453\u201e\u2026\u2020\u2021\u20ac\u2030\u0409\u2039\u040a\u040c\u040b\u040f\u0452\u2018\u2019\u201c\u201d\u2022\u2013\u2014\ufffd\u2122\u0459\u203a\u045a\u045c\u045b\u045f\xa0\u040e\u045e\u0408\xa4\u0490\xa6\xa7\u0401\xa9\u0404\xab\xac\xad\xae\u0407\xb0\xb1\u0406\u0456\u0491\xb5\xb6\xb7\u0451\u2116\u0454\xbb\u0458\u0405\u0455\u0457\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041a\u041b\u041c\u041d\u041e\u041f\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042a\u042b\u042c\u042d\u042e\u042f\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043a\u043b\u043c\u043d\u043e\u043f\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044a\u044b\u044c\u044d\u044e\u044f'
};

function decodeBytes(bytes, encoding) {
    var enc= encodings[encoding];
    var n= bytes.length;
    var chars= new Array(n);
    for (var i= 0; i<n; i++)
        chars[i]= enc.charAt(bytes.charCodeAt(i));
    return chars.join('');
}
 
function uint8ArrayToArray(uint8Array) {
        var array = [];

        for (var i = 0; i < uint8Array.byteLength; i++) {
            array[i] = uint8Array[i];
        }

        return array;
    }


Parse.Cloud.define("parseAllFile", function(req,res){
  Parse.initialize("WpZR6tYusZlPde1xwQ2J7S8eu29KfzTE6McgV5mQ", "ATow8ize1tKs9ewBIexRs9GZhQjQ4NTM6nIKJ7lM");
  console.log('привет'); 
  
  Parse.Cloud.httpRequest({
    url: 'http://www.fa13.info/build/all13Ho.zip',
    
    headers: {
      'Content-Type': 'application/zip;charset=utf-8'
    }
  }).then(function(httpResponse) {
    console.log('Получили файл');
    try {
      var array = httpResponse.buffer.toString('base64');
      var unpacked =  new JSZip();
      unpacked.load(array, {base64 : true});
      var all = decodeBytes(unpacked.file('all13Ho.b13').asBinary(), 'cp1251');
      res = parseAll(all);
    } catch(e) {
      console.error('Не удалось распаковать: '+e);
    };
  },function(httpResponse) {
    console.error('Request failed with response code ' + httpResponse.status);
  });
});

function parseAll(allText) {
  var allTemp = allText.replace(/\s+\//, ", ");
  var allTemp = allTemp.replace(/\/\s+\//gmi, ", ");
  var allTemp = allTemp.replace(/999\/\s+/gmi, "999");
  var arr = allTemp.split(', ');
  var aDate = arr[1].split('.');
  var allDate = new Date (aDate[2], aDate[1]-1, aDate[0]);
  var iAll = parseTurnir(arr, false)+2;
  
  console.log(iAll + '-'+arr[iAll]);
  
  while (iAll < arr.length) {
    iAll = parseClub(arr, iAll, allDate);
    iAll++;
  }
  var All = Parse.Object.extend("All");
  var all = new All();
  all.save({
    date: allDate
  });

}


function parseTurnir(arr, toBase) {
  var s = '';
  var i = 2;
  var Turnir = Parse.Object.extend("Turnir");
  while (arr[i] != '888') {
    s = arr[i].split('=');
    if (toBase) {
      var turnir = new Turnir();
      turnir.save({
        turnir: s[0],
        sok: s[1]
      });
    }
    i++;
  }
  return i;
}

function parseClub(arr, i, date) {
  var Club = Parse.Object.extend("Club");
  var club = new Club();
 

  var s1 = arr[i].split('/');

  club.set("date", date);
  club.set("name", s1[0]);
  club.set("clubId", s1[1]);
  club.set("city", s1[2]);
  club.set("country", s1[3]);

  var Flags = Parse.Object.extend("Flags");
  var getFlag = new Parse.Query(Flags);
  getFlag.equalTo("name", s1[3]);
  getFlag.first().then(function(object) {
    club.set("flag", object.get("flag"));
  });
  club.set("stadionName", s1[4]);
  
  i++;
  var s2 = arr[i].split('/');

  var Man = false;
  if (s2[1]!='нет'){
    Man = true;
  }
  if (Man == true) {
      var Manager = Parse.Object.extend("Manager");
  var manager = new Manager();

  manager.set("date", date);
  manager.set("name", s2[1]);
  manager.set("city", s2[2]);
  manager.set("country", s2[3]);
  var Flags = Parse.Object.extend("Flags");
  var getFlag = new Parse.Query(Flags);
  getFlag.equalTo("name", s2[3]);
  getFlag.first().then(function(object) {
    manager.set("flag", object.get("flag"));
  });
  manager.set("email", s2[4]);
  manager.set("icq", s2[5]);
  manager.set("matches", s2[6]);
  }

  i++;
  var s3 = arr[i].split('/');

  if (Man) {
  manager.set("fm", s3[4]);

  manager.save(null, {
    success: function(manager) {
      
    },
    error: function(manager, error) {
      console.error('Не могу создать запись менеджера, with error code: ' + error.message);
    }
  });
  

  club.set("manager", manager);
}
  club.set("stadionSize", s3[0]);
  club.set("stadionState", s3[1]);
  club.set("bum", s3[2]);
  club.set("fc", s3[3]);
  club.set("raiting", s3[5]);
  club.set("base", s3[6]);
  club.set("baseState", s3[7]);

  i++;
  var s = arr[i].split('/');

  club.set("school", s[0]);
  club.set("schoolState", s[1]);
  club.set("coach", s[2]);
  club.set("goalkeepersCoach", s[3]);
  club.set("defendersCoach", s[4]);
  club.set("midfieldersCoach", s[5]);
  club.set("forwardsCoach", s[6]);
  club.set("fitnessCoach", s[7]);
  club.set("moraleCoach", s[8]);
  club.set("doctorQualification", s[9]);
  club.set("doctorPlayers", s[10]);
  club.set("scout", s[11]);

  i++;
  var s = arr[i].split('/');

  if(s.length>0){club.set("homeTop", s[0]);}
  if(s.length>1){club.set("awayTop", s[1]);}
  if(s.length>1){club.set("homeBottom", s[2]);}
  if(s.length>1){club.set("awayBottom", s[3]);}

  club.save(null, {
    success: function(club) {
      
    },
    error: function(club, error) {
      console.error('Не могу создать запись клуба, with error code: ' + error.message);
    }
  });
  

  i++;
  var s = arr[i].split(',');

  var Turnir = Parse.Object.extend("Turnir");
  for (var j = 0; j < s.length; j++) {
    var query = new Parse.Query(Turnir);
    query.equalTo("sok", s[j]);
    query.first({
      success: function(object) {
     //   var relation = club.relation("turnirs");
     //   relation.add(object);
     //   club.save();
      },
      error: function(error) {
        console.log("Error: " + error.code + " " + error.message);
     }
    });
  };

  i++;

  var Player = Parse.Object.extend("Player");

  while (arr[i] != '999') {
    var s = arr[i].split('/');
    var player = new Player();
    player.set("date", date);
    player.set('clubName', club.get('name'));
    player.set('number', s[0]);
    player.set('name', s[1]);
    player.set('nationality', s[2]);
    var Flags = Parse.Object.extend("Flags");
  var getFlag = new Parse.Query(Flags);
  getFlag.equalTo("name", s[2]);
  getFlag.first().then(function(object) {
    player.set("nationalityCode", object.get("flag"));
  });
    player.set('position', s[3]);

    var pId = 0;
    switch (s[3]) {
      case 'ВР':
        pId = 1;
        break;
      case 'ЛЗ':
        pId = 2;
        break;
      case 'ЦЗ':
        pId = 3;
        break;
      case 'ПЗ':
        pId = 4;
        break;
      case 'ЛП':
        pId = 5;
        break;
      case 'ЦП':
        pId = 6;
        break;
      case 'ПП':
        pId = 7;
        break;
      case 'ЛФ':
        pId = 8;
        break;
      case 'ЦФ':
        pId = 9;
        break;
      case 'ПФ':
        pId = 10;
        break;
      default:
        pId = 0;
    }

    player.set('positionId', pId);
    player.set('age', s[4]);
    player.set('talent', s[5]);
    player.set('experience', s[6]);
    player.set('fitness', s[7]);
    player.set('morale', s[8]);
    player.set('strength', s[9]);
    player.set('health', s[10]);
    player.set('price', s[11]);
    player.set('salary', s[12]);
    player.set('shooting', s[13]);
    player.set('passing', s[14]);
    player.set('crossing', s[15]);
    player.set('dribbling', s[16]);
    player.set('tackling', s[17]);
    player.set('heading', s[18]);
    player.set('speed', s[19]);
    player.set('stamina', s[20]);
    player.set('reflexes', s[21]);
    player.set('handling', s[22]);
    player.set('disqualification', s[23]);
    player.set('rest', s[24]);
    player.set('teamwork', s[25]);
    player.set('games', s[26]);
    player.set('goalsTotal', s[27]);
    player.set('goalsMissed', s[28]);
    player.set('goalsChamp', s[29]);
    player.set('mark', s[30]);
    player.set('gamesCareer', s[31]);
    player.set('goalsCareer', s[32]);
    player.set('yellowCards', s[33]);
    player.set('redCards', s[34]);
    player.set('transfer', s[35]);
    player.set('lease', s[36]);
    player.set('birthplace', s[37]);
    var f = s[38].split('(');
    if (f.length > 0) {
      player.set('birthdate', f[0]);
      player.set('birthtour', f[0].substr(0, f[0].length-1));  
    };
    player.set('assists', s[39]);
    player.set('profit', s[40]);
    player.set('playerId', s[41]);

    player.save(null, {
      success: function(player) {

     },
      error: function(player, error) {
        console.error('Не могу создать нового игрока, with error code: ' + error.message);
     }
    });    
   //     var relation = club.relation("players");
   //     relation.add(player);
   //     club.save();
    i++;  
  }

  return i;


}

