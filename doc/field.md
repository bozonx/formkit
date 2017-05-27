# Field

## Initialize a field

### As an array

    form.init(['id', 'title', 'body']);

It just initialize those fields, you can configure them later.


### As an object

    form.init({
      id: null,
      name: {
        initial: 'first value',   // value which will be inserted to field fixed value.
        defaultValue: 'no name',
        disabled: true,
        validate: () => {},
      },
      checkbox: {
        default: true,
      },
    });


## Values

### Default value

Default value uses to reset field to default state.
You can set default value on field of form init. It value will be set to input 
if  you doesn't pass a initial value.
You can get default value by running: `field.default`.

### Initial value

It uses for setting a first value instead loading data from server.
You can set initial value on field of form init. It value immediately sets "value" field 
and you can get like that: `field.value`.

### Saved value

It is last saved state. It uses to set data received from server to field.
You can set in by: `field.setSavedValue()`.
You can reset current field value to saved value: `field.clearUserInput()`
after that will be used saved value or default value if there isn't a saved value.

### User input

To set a value by user input, run this on onChange input's event `field.handleChange(newValue)`.
It will rise a "change" event.


### Programmatic setting a value

For setting a value from app's code, run `field.setValue()`. It sets a value 
without rising a rising a "change" event.
