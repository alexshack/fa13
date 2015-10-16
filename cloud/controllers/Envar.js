/**
 * Created by sandr on 13.10.15.
 */
(function () {
// Constructor
    function Envar() {
        // always initialize all instance properties
        console.log('instance Envar created');

        this.init = function () {

        var env = this;
            console.log("Envar initializes");

            var promise = new Parse.Promise();

            var query = new Parse.Query('Envar');
            query.find({
                success: function (vars) {
                    for (var i = 0; i < vars.length; i++) {
                        env[vars[i].get('name')] = {
                            "name": vars[i].get('name'),
                            "class": vars[i].get('class'),
                            "value": vars[i].get('value'),
                            "db":vars[i]
                        };
                    }

                    //console.log("Envar inited: " + JSON.stringify(this));
                    promise.resolve(env);
                },

                error: function (vars, error) {
                    promise.reject(error);
                }
            });

            return promise;
        };


        this.getVarAsObject = function (varName) {
            var env = this;
            var promise = new Parse.Promise();
            console.log(env);
            if(typeof  env[varName] == "undefined") {
                promise.resolve(null);
                return promise;
            }

            var vClass = env[varName].class;
            var vObjectId = this[varName].value;

            var query = new Parse.Query(vClass);

            query.get(vObjectId, {
                success: function (envarObject) {
                    promise.resolve(envarObject);
                },

                error: function (variable, error) {
                    if (error.code === Parse.Error.OBJECT_NOT_FOUND) {
                        promise.resolve(null);
                    } else {
                        promise.reject(error);
                    }

                }
            });

            return promise;
        };

        this.changeObjectInEnvar = function (varClass, varName, varColumn, varValue) {
            var env = this;
            var promise = new Parse.Promise();

            var obj = env[varName];
            if (typeof  obj!="undefined") {
                if (obj.class != varClass) {
                    console.log("Несовпадение класса в " + varName + ". Ожидается " + obj.class + ", передано " + varClass);
                    promise.reject("Несовпадение класса в " + varName + ". Ожидается " + obj.class + ", передано " + varClass);
                    return promise;
                }
            } else {

                    promise.reject("Переменной " + varName + " не существует");
                    return promise;

            }


            this.getVarAsObject(varName).then(function (envObject) {
                if (!envObject) {


                        promise.reject("Значение переменной " + varName + " не ссылается на объект в БД");


                }


                envObject.set(varColumn, varValue);

                envObject.save().then(function (env) {

                    promise.resolve(env[varName]);

                }, function (env, error) {
                    promise.reject("Error on changing object linked in envVar with name " + varName);

                });

            });

            return promise;
        };

        this.setValueToVar = function (varClass, varName, varValue, createIfDoesNotExist) {
            var env = this;
            var promise = new Parse.Promise();

            var obj = env[varName];
            if (typeof  obj!="undefined") {
                if (obj.class != varClass) {
                    console.log("Несовпадение класса в " + varName + ". Ожидается " + obj.class + ", передано " + varClass);
                    promise.reject("Несовпадение класса в " + varName + ". Ожидается " + obj.class + ", передано " + varClass);
                    return promise;
                }
            } else {
                if (!createIfDoesNotExist) {
                    promise.reject("Переменной " + varName + " не существует");
                    return promise;
                }

                env[varName] = {};
                obj = env[varName];
            }

            obj.class = varClass;
            obj.name = varName;
            obj.value = varValue;

            if(!obj.db) {
                 obj.db = new Parse.Object('Envar');
            }

            obj.db.save({
                name: varName,
                class: varClass,
                value: varValue
            }).then(function(db) {
                obj.db = db;
                promise.resolve(obj);
            }, function(db, error) {
                promise.reject("Error on creating or changing envVar with name " + varName);
            });


            return promise;
        };

        return this;

    }

// class methods

// export the class
    exports.Envar = Envar;
})();
