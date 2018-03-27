# formkit

[![Build Status](https://travis-ci.org/bozonx/formkit.svg?branch=master)](https://travis-ci.org/bozonx/formkit)      [![npm version](https://badge.fury.io/js/formkit.svg)](https://badge.fury.io/js/formkit)   [![dependencies](https://david-dm.org/bozonx/formkit/status.svg)](https://david-dm.org/bozonx/formkit)   [![dependencies](https://david-dm.org/bozonx/formkit/dev-status.svg)](https://david-dm.org/bozonx/formkit?type=dev)

Smart form helper. It's framework agnostic.


## Install

    npm install formkit

## Usage

There is example of common usage without any frameworks.

    import formkit from 'formkit';

    const validate = (errors, values) => {
      if (!values.firstname) errors.firstname = 'Required';
    };
    
    // get new form instance
    const form = formkit.newForm();
    // initialize form fields
    form.init([
      'firstname',
    ], validate);
    
    const submitHandler = (values) => console.log('The form has submittes with', values);
    form.onSubmit(submitHandler);
    
    // change field's value
    form.fields.firstname.handleChange('my new name');
    
    console.log(form.fields.firstname.dirty)        // false - field is different with previously saved state
    console.log(form.fields.firstname.touched)      // true - field was dirty at least once since form has initialized.
    console.log(form.fields.firstname.valid)        // true
    console.log(form.fields.firstname.invalidMsg)   // '' - message which sets in validate function
    
    // emit submit event - "submitHandler" will be called
    form.handleSubmit();

To use in your favorite framework you have to call field's `handleChange` method
after each field changes. And call `fom.handleSubmit()` submit on form submit if submitting is using.
In other hand you can add handler on form saving `form.onSave(callback)`
to save form's state after field change.


## Test running

    npm test
