'use strict';
require('dotenv').config({silent: true, path: '../local.env'});
var debug = require('debug');
const log = debug('dpc-assetfinder-db');
// var cache = require('memory-cache');
var Cloudant = require('cloudant');
var vcap_services = JSON.parse(process.env.VCAP_SERVICES);
var cloudant = Cloudant({vcapServices: vcap_services, plugin: 'promises'});
var dbname = process.env.CLOUDANT_DBNAME;
var cloudantdb;
// var questionnaire_dbname = process.env.QUESTIONNAIRE_DBNAME;

exports.checkDB = () => {
  getDB(dbname)
    .then(db => {
      log('found database');
      cloudantdb = db;
    })
    .catch(err => {
      log('error in getting db', dbname, err);
      return;
    });
}
exports.checkDB();

exports.getConfigurationBySpaceId = (spaceId) => {
  return new Promise( (resolve, reject) => {
    log('----> entering getConfigurationBySpaceId');
      var query = {
        'selector': {
          'spaceId': {
            '$eq': spaceId
          }
        }
      }
      cloudantdb.find(query)
      .then( (data) => {
        log('found configuration for this space');
        log('<---- exiting getConfigurationBySpaceId');
        resolve(data);
      })
      .catch( (err) => {
        log('error getting data for spaceId ', spaceId, err);
        log('<---- exiting getConfigurationBySpaceId');
        reject(err);
      });
  });
}

exports.saveConfiguration = (data) => {
  return new Promise((resolve, reject) => {
    log('---> entering saveConfiguration with data', data);
    exports.getConfigurationBySpaceId(data.spaceId)
    .then(result => {
      // log('result of getConfiguration:', result);
      if (result.docs.length === 0) {
        log('existing config not found');
        cloudantdb.insert(data)
        .then(result => {
          log('success inserting:', result);
          resolve({result:'success'});
        })
        .catch(err => {
          log('error inserting...', err);
          reject(err);
        });
      } else {
        log('found existing configuration');
        var newdoc = {
          _id: result.docs[0]._id,
          _rev: result.docs[0]._rev,
          spaceId: result.docs[0].spaceId,
          uuid: data.uuid,
          username: data.username,
          password: data.password
        };
        log('newdoc:', newdoc);
        cloudantdb.insert(newdoc, newdoc._id)
        .then(updateResult => {
          log('updateResult:', updateResult);
          resolve({result:'found'});
        })
        .catch(err => {
          log('error updating:', err);
          reject(err);
        })
      }
      // db.insert(doc, doc._id)
      // .then( (result) => {
      //   log('success');
      //   resolve(result);
      // })
      // .catch( (err) => {
      //   log('error in saveConfuration:', err);
      //   reject(err);
      // });
      // resolve(result);
    })
    .catch(err => {
      log('error getting existing configuration:', err);
      reject(err);
    });

    
  });
}


function updateOneDoc(db, doc, delay, start, end) {
  log('in updateOneDoc with delay', delay);
  // log('lastUpdatedDate is', doc.lastUpdatedDate);
  // log('LastUpdatedDate is', doc.LastUpdatedDate);
  // log('createdDate is', doc.createdDate);
  // log('CreatedDate is', doc.CreatedDate);
  if ( typeof doc.lastUpdatedDate === 'undefined'
    && typeof doc.LastUpdatedDate === 'undefined'
    && typeof doc.createdDate === 'undefined'
    && typeof doc.CreatedDate === 'undefined'
  ) {
    log('this q has no dates:', doc._id);
    return Promise.resolve();
  }
  // log('doc:', doc);
	return new Promise((resolve,reject) => {
    // have to have a delay because the Cloudant API complains if you invoke it too fast
  	setTimeout(function() {
  		// log('delaying %d doc %s', delay, doc._id);
      // questionnaire._rev = results._rev;
      // questionnaire._id = results._id;
      var lastUpdatedDate = doc.LastUpdatedDate ;//|| doc.LastUpdatedDate || '';
      // log('bad lastUpdatedDate is', lastUpdatedDate);
      var createdDate = doc.CreatedDate;// || doc.CreatedDate || '';
      // log('bad createdDate is', createdDate);
      log(lastUpdatedDate);
      log(createdDate);
      var updateNeeded = false;
      // log('bad createdDate is', badCreatedDate);
      // log('now to update doc');
      if (lastUpdatedDate !== '' && typeof lastUpdatedDate !== 'undefined') {
        updateNeeded = true;
        var goodLastUpdatedDate =
            lastUpdatedDate.substring(0,4)
          + '-'
          + lastUpdatedDate.substring(4,6)
          + '-'
          + lastUpdatedDate.substring(6,8)
          + 'T'
          + lastUpdatedDate.substring(8,10)
          + ':'
          + lastUpdatedDate.substring(10,12)
          + ':'
          + lastUpdatedDate.substring(12,14)
          + '.000Z';
        // log('goodLastUpdatedDate:', goodLastUpdatedDate);
      }
      if (createdDate !== '' && typeof createdDate !== 'undefined') {
        updateNeeded = true;
        var goodCreatedDate =
            createdDate.substring(0,4)
          + '-'
          + createdDate.substring(4,6)
          + '-'
          + createdDate.substring(6,8)
          + 'T'
          + createdDate.substring(8,10)
          + ':'
          + createdDate.substring(10,12)
          + ':'
          + createdDate.substring(12,14)
          + '.000Z';
        // log('goodCreatedDate:', goodCreatedDate);
      }
      updateNeeded = false;
      if (updateNeeded) {
        log('updating doc', doc._id);
        doc.CreatedDate = goodCreatedDate;
        doc.LastUpdatedDate = goodLastUpdatedDate;
        // log('the goodCreatedDate is', goodCreatedDate);
        db.insert(doc, doc._id)
        .then( (result) => {
          resolve(result);
        })
        .catch( (err) => {
          log('error in updating:', err);
          reject(err);
        })
      } else {
        return Promise.resolve();
      }
      // log(new Date().toISOString());
      // db.insert(questionnaire, questionnaire._id)
    	// 	.then(function(result) {
    	// 		log('bulk insert successful for %d records (%d to %d)', docsToInsert.length, start, end - 1);
      //     resolve({result:'bulk insert successful',nbrOfRecords:docsToInsert.length});
    	// 	})
    	// 	.catch(function(err){
    	// 		log('error on bulk insert', err);
      //     reject(err);
    	// 	})
  	}, delay);
	});
}
exports.storeMachineTypes = (data, eraseData) => {
  // log('data is', data);
  return new Promise(function(resolve, reject) {


  // var cloudant = Cloudant({vcapServices: JSON.parse(process.env.VCAP_SERVICES), plugin: 'promises'});
  // var dbname = process.env.DBNAME;

  getDB(cloudant, machine_types_dbname)
  	.then(function(db) {
  		log('found database');
  		cloudantdb = db;
      log('about to bulk insert %d documents', data.length);
      var promises = [];
      var nbrToInsert = 1000;
      var count = 0;
      for (var i = 0; i < data.length; i++ ) {
        let limit = i + nbrToInsert > data.length ? data.length : i + nbrToInsert;
        let docsToInsert = data.slice(i, limit);
        log('about to bulk insert records %d to %d', i, limit - 1);
        // for (let i = 0; i < data.length; i++) {
    	  	let delay = count++ * 500; // every Promise delays a half-second more than the previous one
      		promises.push(makePromise(db, docsToInsert, delay, i, limit));
          i = i + nbrToInsert - 1;
    	}
      	Promise.all(promises)
        .then((result) => {
      		log('in promise.all');
      		resolve(result);
      	})
      	.catch((err) => {
      		log('error in one of the bulk insert promises:', err);
      		reject(err);
      	});
        // db.bulk({docs:docsToInsert})
      	// 	.then(function(result) {
      	// 		log('bulk insert successful for %d records', docsToInsert.length);
        //     i += nbrToInsert;
        //     // resolve({result:'bulk insert successful'});
      	// 	})
      	// 	.catch(function(err){
      	// 		log('error on bulk insert', err);
        //     reject(err);
      	// 	})
        // }

  	})
  	.catch(function(err) {
  		log('error in getting db:', err);
      reject(err);
  	});
});
  }

function makePromise(db, docsToInsert, delay, start, end) {
  log('in makePromise with delay', delay);
	return new Promise((resolve,reject) => {
    // have to have a delay because the Cloudant API complains if you invoke it too fast
  	setTimeout(function() {
  		log('delaying %d for %d docs', delay, docsToInsert.length);
  		db.bulk({docs:docsToInsert})
    		.then(function(result) {
    			log('bulk insert successful for %d records (%d to %d)', docsToInsert.length, start, end - 1);
          resolve({result:'bulk insert successful',nbrOfRecords:docsToInsert.length});
    		})
    		.catch(function(err){
    			log('error on bulk insert', err);
          reject(err);
    		})
  	}, delay);
	});
}

exports.saveQuestionnaire = (data) => {

  return new Promise( (resolve, reject) => {
    log('-------> entering saveQuestionnaire');
    log('data to save:', data);
    getDB(cloudant, questionnaire_dbname)
    	.then( (db) => {
        // data._id = data._id;
        var datestring = getDateString();
        data.CreatedDate = datestring;
        data.LastUpdatedDate = datestring;
        log('about to insert', data);
        db.insert(data)
        .then( (result) => {
          log('result of insert is', result);
          log('<--------- exiting saveQuestionnaire');
          resolve(result);
        })
        .catch( (err) => {
          log('could not insert %s: %o', data.id, err);
          log('<--------- exiting saveQuestionnaire');
          reject(err);
        })
      })
      .catch( (err) => {
        log('error getting database:', err);
        log('<--------- exiting saveQuestionnaire');
        reject(err);
      });
  });

}

exports.listQuestionnaires = () => {
  return new Promise((resolve,reject) => {

  // var skip = page * 30;
  // var cloudant = Cloudant({vcapServices: vcap_services, plugin: 'promises'});
  // var cloudantdb;

  // var dbname = env.DBNAME;//'workspace_explorer';
  // log('questionnaire_dbname is %s', questionnaire_dbname);
  getDB(cloudant, questionnaire_dbname)
  	.then(function(db) {
      log('got db, making query');
      var query = {
        "selector": {
          "_id": {
            "$gt": "0"
          }
        },
        // "fields": [
        //   "_id",
        //   "_rev"
        // ],
        "sort": [
          {
            "_id": "asc"
          }
        ]
      }
      log('query is %O', query);
      db.find(query)
      .then( (data) => {
        log('got data!');
        resolve(data);
      })
      .catch( (err) => {
        log('error getting questionnaires ', vendor, err);
        reject(err);
      });
    });
  });
}

exports.getQuestionnairesByCreator = (creatorName) => {
  log('-----> entering getQuestionnairesByCreator');
  return new Promise((resolve,reject) => {

  // var skip = page * 30;
  // var cloudant = Cloudant({vcapServices: vcap_services, plugin: 'promises'});
  // var cloudantdb;

  // var dbname = env.DBNAME;//'workspace_explorer';
  // log('questionnaire_dbname is %s', questionnaire_dbname);
  getDB(cloudant, questionnaire_dbname)
  	.then(function(db) {
      // log('got db, making query');
      var query = {
        'selector': {
          'Creator': {
            '$eq': creatorName
          }
        },
         'sort': [
            {
               'LastUpdatedDate:string': 'asc'
            }
         ],
        'fields': [
          '_id',
          'Customer',
          'CreatedDate',
          'LastUpdatedDate',
          'SizingFor',
          'QuestionnaireState'
        ]
      }
      // log('query is %O', query);
      db.find(query)
      .then( (data) => {
        log('got data!');
        log('<---- exiting getQuestionnairesByCreator');
        resolve(data);
      })
      .catch( (err) => {
        log('error getting questionnaires ', creatorName, err);
        log('<---- exiting getQuestionnairesByCreator');
        reject(err);
      });
    });
  });
}

exports.findBy = (qs) => {

  return new Promise((resolve,reject) => {
    if ( Object.keys(qs).length === 0 ) {
      log('findBy received empty search criteria');
      resolve({error:'Please provide search parameters'});
      return;
    }
    var selector = '';
    var selectorJson = {};
    var firstTime = true;
    Object.keys(qs).forEach(function(key) {
      log(key, qs[key]);
      if ( !firstTime ) {
        selector += ',';
      }
      firstTime = false;
      var quotes = isNaN(qs[key]) ? '"' : '';
      var selection = '{"' + key + '": { "$eq": ' + quotes +  qs[key] + quotes + '}}';
      log('selection is', selection);
      var parsedSelection = JSON.parse(selection);
      log('now parsed:', parsedSelection);
      selector += selection;//.push(JSON.parse(selection));
      selectorJson[key] = { "$eq": qs[key]};
      log('selectorJson is', selectorJson);
    });
    // selector += '}';
    log('selector is', selector);
    // log('parsed is', JSON.parse(selector));
    log('complete is', selectorJson);
    // var creatorName = 'dcacy@us.ibm.com';

  // log('questionnaire_dbname is %s', questionnaire_dbname);
  getDB(cloudant, questionnaire_dbname)
  	.then(function(db) {
      log('got db, making query');
      var query = {
        "selector": selectorJson
      }
      log('query is %O', query);
      db.find(query)
      .then( (data) => {
        // log('got data!');
        log('<------ exiting findBy');
        resolve(data);
      })
      .catch( (err) => {
        log('error getting questionnaires ', err);
        log('<----- exiting findBy');
        reject(err);
      });
    });
  });
}

exports.getOneQuestionnaire = (id) => {
  return new Promise((resolve,reject) => {
    log('-------> entering getOneQuestionnaire');
    var cachedQuestionnaire = cache.get(id);
    // log('cachedMachineType:', cachedMachineType);
    if (cachedQuestionnaire) {
      log('retrieving Questionnaire %s from cache', id);
      log('<-------- exiting getOneQuestionnaire');
      resolve(cachedQuestionnaire);
      return;
    }

    getDB(cloudant, questionnaire_dbname)
    	.then(function(db) {
        log('got db, doing lookup');
        // db.find(query)
        // our cloudant plan gives 20 lookups per second
        // but only five queries per second,
        // so let's do a get instead of a find :-)
        db.get(id)
        .then( (data) => {
          log('found questionnaire', id);
          cache.put(id, data, 5000, function(key) {
            log('cached questionnaire %s expired', key);
          });
          log('<------- exiting getOneQuestionnaire');
          resolve(data);
        })
        .catch( (err) => {
          log('error getting questionnaire ', id, err);
          log('<------- exiting getOneQuestionnaire');
          reject(err);
        });
      })
      .catch( (err) => {
        log('error getting database:', err);
        log('<------- exiting getOneQuestionnaire');
        reject(err);
      })
  });
}

exports.deleteOneQuestionnaire = (id) => {
  return new Promise((resolve,reject) => {
    exports.getOneQuestionnaire(id)
    .then( (results) => {
      if (results) {
        log('found doc to delete:', results);
        getDB(cloudant, questionnaire_dbname)
        	.then(function(db) {
            log('got db, deleting...');
            // log('query is %O', query);
            db.destroy(results._id, results._rev)
            .then( (results) => {
              log('deleted questionnaire', results);
              resolve(results);
            })
            .catch( (err) => {
              log('error deleting questionnaire ', id, err);
              reject(err);
            });
          })
          .catch( (err) => {
            log('error getting questionnaire to delete:', id, err);
            reject(err);
          });
      } else {
        reject({error:'Could not find doc with id ' + id});
      }
    })
    .catch( (err) => {
      log('error trying to get one questionnaire to delete; id is', id, err);
      reject(err);
    });
  });
}

exports.updateQuestionnaire = (questionnaire) => {
  return new Promise((resolve,reject) => {
    log('-------> entering updateQuestionnaire');

    exports.getOneQuestionnaire(questionnaire._id)
    .then( (results) => {
      log('got one questionnaire to update');
        getDB(cloudant, questionnaire_dbname)
          .then(function(db) {
            questionnaire._rev = results._rev;
            // questionnaire._id = results._id;
            questionnaire.LastUpdatedDate = getDateString();
            log('now to update doc');
            db.insert(questionnaire, questionnaire._id)
            .then( (results) => {
              log('document updated!', results);
              resolve(results);
            })
            .catch( (err) => {
              log('error updating document ', questionnaire._id, err);
              reject(err);
            })
          })
          .catch( (err) => {
            log('error getting database:', err);
            reject(err);
          });
        // });
    })
    .catch( (err) => {
      log('error getting questionnaire', id, err);
      reject(err);
    });
  });
}

exports.getMachineTypes = (qs) => {
  log('query parm is', qs);
  if (typeof qs === 'undefined' || typeof qs.vendor === 'undefined') {
    return Promise.reject({error:'No vendor parameter provided'});
  } else if (typeof qs.page === 'undefined') {
    return Promise.reject({error:'No page parameter provided'});
  }

  return new Promise((resolve,reject) => {

    var skip = qs.page * 30;
    var query = {
      "selector": {
        "Vendor": {
          "$eq": qs.vendor
        }
      },
      "fields": [
        "_id"
        ,"_rev"
        ,"Vendor"
      ,"Server Description"
      ,"FamilyName"
      ,"Model"
      ,"Processor"
      ,"Processor Code-name"
      ,"Announced Date"
      ,"Architecture"
      ,"Chip Count"
      ,"Core Count"
      ],
      "sort": [
          "FamilyName:string"
          ,"Model:string"
      ],
      "limit": 30,
      "skip": skip
    };

    if (typeof qs.cores !== 'undefined') {
      query.selector['Core Count'] = {"$eq":qs.cores};
    }
    if (typeof qs.architecture !== 'undefined') {
      query.selector['Architecture'] = {"$eq":qs.architecture};
    }

    log('query:', query);
    // var cloudant = Cloudant({vcapServices: vcap_services, plugin: 'promises'});
    // var cloudantdb;

    // var dbname = env.DBNAME;//'workspace_explorer';
    // log('machine_types_dbname is %s', machine_types_dbname);
    getDB(cloudant, machine_types_dbname)
    	.then(function(db) {
        // log('got db, making query');

        // log('query is %O', query);
        db.find(query)
        .then( (data) => {
          log('got data! %d records', data.docs.length);
          resolve(data);
        })
        .catch( (err) => {
          log('error getting vendor ', qs.vendor, err);
          reject(err);
        });
      });
  });
}

exports.getOneMachineType = (id) => {
  log('--------> entering getOneMachineType');
  return new Promise((resolve,reject) => {
    // log('typeof id is', typeof id, 'and id is', id);
    if (typeof id == 'undefined') {
      log('no ID for machine type found');
      reject({error:'no ID provided to db.getOneMachineType'});
      return;
    }
    var cachedMachineType = cache.get(id);
    // log('cachedMachineType:', cachedMachineType);
    if (cachedMachineType) {
      // log('retrieving Machine Type %s from cache', id);
      log('<-------- exiting getOneMachineType');
      resolve(cachedMachineType);
      return;
    } else {
      log('could not find Machine Type in cache; querying database');
    }
  // var skip = page * 30;
  // var cloudant = Cloudant({vcapServices: vcap_services, plugin: 'promises'});
  // var cloudantdb;

  // var dbname = env.DBNAME;//'workspace_explorer';
  // log('machine_types_dbname is %s', machine_types_dbname);
  getDB(cloudant, machine_types_dbname)
  	.then(function(db) {
      // log('got db, making query');
      // var query = {
      //   "selector": {
      //     "_id": {
      //       "$eq": id
      //     }
      //   }
      // }
      // log('query is %O', query);
      // db.find(query)
      db.get(id)
      .then( (data) => {
        // log('got data!');
        cache.put(id, data, 600000, function(key) {
          log('cached machine type %s expired', key);
        });
        log('<------- exiting getOneMachineType');
        resolve(data);
      })
      .catch( (err) => {
        log('error getting one machine type ', id, err);
        log('<------- exiting getOneMachineType');
        reject(err);
      });
    });
  });
}

function getDB(dbname) {

	return new Promise(function(resolve, reject) {

		cloudant.db.list().then(function(data) {
			var foundIt = data.find(function(db) {
				return db === dbname;
			});
			if (!foundIt) { // undefined
				log('cannot find db', dbname);
				reject('cannot find db', dbname);
			} else {
				resolve(cloudant.db.use(dbname));
			}
		});
	});
}


// function createDB(cloudant, dbname) {

// 	return new Promise(function(resolve, reject) {
// 		log('creating db');
// 		cloudant.db.create(dbname).then(function(data){
// 			log('result from create is', data);
// 			resolve(true);
// 		})
// 		.catch(function(err){
// 			log('error in create:', err);
// 			reject(false);
// 		});
// 	});
// }

// function deleteDB(cloudant, dbname) {

// 	return new Promise(function(resolve, reject) {
// 		log('deleting db');
// 		cloudant.db.delete(dbname).then(function(data){
// 			log('result from delete is', data);
// 			resolve(true);
// 		})
// 		.catch(function(err){
// 			log('error in delete:', err);
// 			reject(false);
// 		});
// 	});
// }

function getDateString() {
  // var d = new Date();
  // var datestring =
  //   d.getUTCFullYear()
  //   + "-"
  //   + ("0"+(d.getUTCMonth()+1)).slice(-2)
  //   + "-"
  //   + ("0" + d.getUTCDate()).slice(-2)
  //   + " "
  //   + ("0" + d.getUTCHours()).slice(-2)
  //   + ":"
  //   + ("0" + d.getUTCMinutes()).slice(-2)
  //   + ":"
  //   + ("0" + d.getUTCSeconds()).slice(-2);
  //
  // return datestring;
  return new Date().toISOString().replace('T',' ');
}
