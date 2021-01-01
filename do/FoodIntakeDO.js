(function(){

	return;

	customMultiDataObjectEditor.registerDataObject(
		DataObjects.createDataObjectType({
			name: "FoodIntake",
			types: {
				id: "int",
				time: "string",
				food: "string",
				quantity: "int",
				calories: "int"
			},
		}),
		{
			_COLsort: "time",
			_reverseSort: true,

			_renderOptions: {
				typeoptions: {
					calories: {
						label: "kcal"
					}
				},
				hideFields: ["id"]
			},

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
				hideFields: ["id"]
			}
		}
	);

}());