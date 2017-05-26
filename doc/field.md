# Field

## Initialize a field

### As an array

    form.init(['id', 'title', 'body']);

It just initialize those fields, you can configure them later.


### As an object

    form.init({
      id: null,
      name: {
        default: 'no name',
        disabled: true,
        validate: () => {},
      },
      checkbox: {
        default: true,
      },
    });
