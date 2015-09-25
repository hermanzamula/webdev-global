var window = {};
(function (window) {

    "use strict";

    var ModelValidator = function () {

        var schemas = {};

        var validators = {};

        var typeValidators = {
            _commonValidator: function _commonValidator(value) {
                return function (data) {
                    var type = Object.prototype.toString.call(data).toLowerCase();
                    return type === "[object " + value + "]";
                }
            }
        };

        typeValidators["uuid"] = function (data) {
            var regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return regex.test(data);
        };

        typeValidators["string"] = typeValidators._commonValidator("string");

        typeValidators["date"] = typeValidators._commonValidator("date");

        typeValidators["number"] = typeValidators._commonValidator("number");

        var registerValidator = function (field, callback) {

            validators[field] = function (value, data) {

                var options = {
                    value: value,
                    data: data
                };

                return callback.call(this, options);
            }

        };

        registerValidator("type", function (options) {


            var typeValidator = typeValidators[options.value];

            if (isNone(typeValidator)) {
                console.warn("Unknown type for validation: " + options.value);
                return;
            }

            return !!typeValidator.call(this, options.data);

        });

        registerValidator("min", function (options) {

            if (typeof options.data === "undefined") {
                return false;
            }

            var data = options.data.length ? options.data.length : options.data;

            if (isNone(data)) {
                return false;
            }

            return data >= options.value;

        });

        registerValidator("max", function (options) {

            if (typeof options.data === "undefined") {
                return;
            }

            var data = options.data.length ? options.data.length : options.data;

            if (isNone(data)) {
                return false;
            }

            return data <= options.value;

        });

        function isValid(data, parameterSchema) {

            var paramNames = Object.keys(parameterSchema);

            paramNames.sort(function (a) { //put required at the beginning
                return (a === "required") ? 0 : 1;
            });

            for (var i = 0; i < paramNames.length; i++) {

                var paramName = paramNames[i];
                var paramValue = parameterSchema[paramName];

                if (paramName === "required") {
                    if (Boolean(paramValue) === true && (data == null || data == undefined)) {
                        return false;
                    }
                    continue;
                }

                var validator = validators[paramName];

                if (isNone(validator)) {
                    console.warn("Unknown field for validation: " + paramName);
                    return true; //Ignore unknown field for validation;
                }

                var fieldValid = validator.call(this, paramValue, data);

                if (!fieldValid) {
                    return false;
                }

            }

            return true;
        }

        function registerModel(name, model) {

            if (isNone(name)) {
                return;
            }
            if (isNone(model)) {
                return;
            }
            schemas[name] = {
                schema: model,
                parameters: Object.keys(model)
            };
        }

        function validate(name, object) {

            var model = schemas[name];

            if (isNone(model)) {
                console.warn("There is no model registered for type \"" + name + "\"");
                return;
            }

            if (isNone(object)) {
                console.warn("Object for validation is null");
                return;
            }

            for (var i = 0; i < model.parameters.length; i++) {

                var key = model.parameters[i];
                var data = object[key];

                //console.log("Validating: " + key + ": " + data);

                if (!isValid(data, model.schema[key])) {
                    return false;
                }

            }

            return true;
        }

        function dispose() {
            schemas = {};
        }

        function isNone(data) {
            return data === undefined || data === null;
        }

        this.registerModel = registerModel;

        this.validate = validate;

        this.dispose = dispose;


    };

    window.ModelValidator = new ModelValidator();

})
(window);

window.ModelValidator.registerModel("user", {
    id: {type: "uuid", required: true},
    name: {type: "string", min: 1, max: 64},
    createdAt: {type: "date"},
    counter: {type: "number", min: 0, max: 64}
});

var user = {
    id: "61cecfb4-da43-4b65-aaa0-f1c3be81ec53",
    name: "Alex Bardanov",
    createdAt: new Date(),
    counter: 64
};
var valid = window.ModelValidator.validate("user", user);

console.log(valid);

window.ModelValidator.dispose();

window.ModelValidator.validate("user", user);


