# FormTypes

## Initialize a form

    import formkit from 'formkit';
    
    const formConfig = {};
    const form = formkit.newForm(formConfig);
    form.init(['id', 'name']);


## Add callbacks

* form.onChange() - set change callback. It calls on user input.
* form.onSave(cb) - set save callback.
    If the callback returns a promise the form will set "saving" state to true.
    While "saving" = true, the form delays another submits calls
    and runs its after current submit has finished.
    When the promise has fulfilled, the from will set "saving" to false.
* form.onSubmit(cb) - set a submit callback.
    If the callback returns a promise the form will set "submitting" state to true.
    While "submitting" = true, the form disallow start another submit.
    When the promise has fulfilled, the from will set "submitting" to false.


## Listen events

For add multiple handlers to events, use `form.on(eventName, callback)` method.
Event name can be:

* change - listen to user input
* silentChange - listen to changes which has done not by user
* anyChange - listen to user's and machine's changes
* saveStart - listen to event on start saving
* saveEnd - listen to event on stop saving, if you set "onSave" callback previously and it returns a promise.
* submitStart - listen to start submitting
* submitEnd - listen to stop submitting, if you set "onSubmit" callback previously and it returns a promise.
