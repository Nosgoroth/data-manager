(function(){

	// Example of a custom type. Remove the 'return' to enable.
	// Copy this file to create a new type. No need to declare it anywhere else for it to work
	// Check PreorderDO.js for a more complex type.

	return;

	customMultiDataObjectEditor.registerDataObject(
		DataObjects.createDataObjectType({
			name: "FoodIntake", // Name in the type dropdown and data file name. No spaces or special characters.

			// Columns in the database. Most common are int/float/string/bool
			// There's also enum for multiple choice, in the form ["enum", ["Foo", "Bar", "Baz"]]
			// Check /res/doop/do.js for docs about types
			types: { 
				id: "int",
				time: "string",
				food: "string",
				quantity: "int",
				calories: "int"
			},
		}),
		{
			_COLsort: "time", // Default sort by what column
			_reverseSort: true,

			// Table rendering options
			_renderOptions: {
				typeoptions: {
					calories: {
						label: "kcal"
					}
				},
				hideFields: ["id"] // Array of columns to hide from table
			},

			// Form rendering options
			_formOptions: {
				typeoptions: {
					time: {
						defaultValue: function() {
							return moment().format("YYYY-MM-DD HH:mm");
						}
					},
					quantity: {
						defaultValue: 1
					},
					calories: {
						label: "Calories (kcal)"
					}
				},
				hideFields: ["id"] // Array of columns to hide from form
			}
		}
	);

}());