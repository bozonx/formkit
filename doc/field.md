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
