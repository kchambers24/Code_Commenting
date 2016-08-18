/*global jQuery, Handlebars, Router */
jQuery(function ($) {
  'use strict';
  // $ lets you use jQuery inside the function without interfering with other libraries
  // 'use strict' defines that jQuery should be executed in "strict mode"

  Handlebars.registerHelper('eq', function (a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
  });
  // Handlebars is a logic-less templating engine
  // If a equals b return a temporary change of Handlebars, if falsy to render
  // content in the else part of the block

  var ENTER_KEY = 13;
  var ESCAPE_KEY = 27;
  // creating a variable called ENTER KEY that has a value of 13
  // creating a variable called ENTER KEY that has a value of 27

  var ajax = {
    baseUrl: 'https://fathomless-woodland-51903.herokuapp.com/todos',
    headers: {
      'Authorization': 'Token token=supadupasecret'
    },
    getJSON: function (callback) {
      $.getJSON({
        url: this.baseUrl,
        headers: this.headers,
        success: function (response) {
          callback(response.data)
        }
      })
    },
    // Creating a variable Ajax, passes through the baseUrl and the authorization header
    // receiving data in the form of JSON.
    // success is taking the response and callback is taking the response and returning the data for the response

    create: function (value, callback) {
      $.post({
        url: this.baseUrl,
        headers: this.headers,
        data: { todo: { todo: value } },
        success: function (response) {
          callback(response.data)
        }
      })
      // create is taking a value and callback
      // .post is posting the new todo to the toda list
    },
    destroy: function (todo) {
      if(todo.id.includes('-'))
        return;
      $.ajax({
        type: "DELETE",
        url: `${this.baseUrl}/${todo.id}`,
        headers: this.headers
      });
      // destroy function is deleting the todo with a "-"
    },
    update: function (todo) {
      if(todo.id.includes('-'))
        return;
      $.ajax({
        type: "PUT",
        url: `${this.baseUrl}/${todo.id}`,
        headers: this.headers,
        data: {
          todo: {
            todo: todo.title,
            isComplete: todo.completed
          }
        }
      });
      // Update
    }
  };

  var util = {
    uuid: function () {
      /*jshint bitwise:false */
      var i, random;
      var uuid = '';

      for (i = 0; i < 32; i++) {
        random = Math.random() * 16 | 0;
        if (i === 8 || i === 12 || i === 16 || i === 20) {
          uuid += '-';
        }
        uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
      }

      return uuid;
    },
    // the UUID function is creating a new UUID (universally unique identifier)
    // UUID is an empty string to start, start at 0 and while i is less than 32, increase by 2.
    // take random number and * by 16. If i equals (8, 12, 16, 20) than add a '-'
    // append number to 4 if i equals 12, if false i equals 16, random and 3 or 8.
    // toString(16) turns the number into a hexadecimal string

    pluralize: function (count, word) {
      return count === 1 ? word : word + 's';
    },
    // if count equal one then word, if false than add an "s" to make it plural

    store: function (namespace, data) {
      if (arguments.length > 1) {
        return localStorage.setItem(namespace, JSON.stringify(data));
      } else {
        var store = localStorage.getItem(namespace);
        return (store && JSON.parse(store)) || [];
      }
    }
    // store function, if the arguments length is greater than 1 store in
    // localStorage (browser) and turn into a string.
    // if false, parse store or in an array
  };

  var App = {
    init: function () {
      this.todos = util.store('todos-jquery');
      this.todoTemplate = Handlebars.compile($('#todo-template').html());
      this.footerTemplate = Handlebars.compile($('#footer-template').html());
      this.bindEvents();
      ajax.getJSON(this.integrateList.bind(this));

      var router = new Router({
        '/:filter': (filter) => this.renderFiltered(filter)
      })
      router.init('/all');
    },
     // init starts when the app begins, when the app starts Handlebar compiles the todo and footer templates.
     // init is calling bindEvents
     // ajax is calling getJSON and binding to "this"

     // Router is giving you a filter today list. it is initalizing to all

    bindEvents: function () {
      $('#new-todo').on('keyup', e => this.create(e));
      $('#toggle-all').on('change', e => this.toggleAll(e));
      $('#footer').on('click', '#clear-completed', e => destroyCompleted(e));
      $('#todo-list')
      .on('change', '.toggle', e => this.toggle(e))
        .on('dblclick', 'label', e => this.edit(e))
        .on('keyup', '.edit', e => this.editKeyup(e))
        .on('focusout', '.edit', e => this.update(e))
        .on('click', '.destroy', e => this.destroy(e));
    },
     // bindEvents function is binding all the events below and passing the event through all events.

    renderFiltered: function(filter){
      this.filter = filter;
      this.render();
    },
    // You are filtering what you want to render

    render: function () {
      var todos = this.getFilteredTodos();
      $('#todo-list').html(this.todoTemplate(todos));
      $('#main').toggle(todos.length > 0);
      $('#toggle-all').prop('checked', this.getActiveTodos().length === 0);
      this.renderFooter();
      $('#new-todo').focus();
      util.store('todos-jquery', this.todos);
    },
    // render todo template, target #main and toggle function  todos greater than 0.
    // toggle-all return checked ActiveTodos with a length equal to 0
    // focus on new-todo.
    // JQuery utility method, story todos in the todos-jquery string

    renderFooter: function () {
      var todoCount = this.todos.length;
      var activeTodoCount = this.getActiveTodos().length;
      var template = this.footerTemplate({
        activeTodoCount: activeTodoCount,
        activeTodoWord: util.pluralize(activeTodoCount, 'item'),
        completedTodos: todoCount - activeTodoCount,
        filter: this.filter
      });
    // renderFooter fucntion, created a variable todoCount, counting todos
    // variable activeTodoCount, count the length of the getActiceTodos function
    // variable template, footerTemplate function object
      $('#footer').toggle(todoCount > 0).html(template);
    },
    // suit up #footer, toggle todoCount greater than 0 append html template

    toggleAll: function (e) {
      var isChecked = $(e.target).prop('checked');
    // toggleAll function on event
    // variable isChecked is suited up for event on targed. Prop() gets the first
    // element that is checked

      this.todos.forEach(todo => {
        todo.completed = isChecked;
        ajax.update(todo);
      });
      this.render();
    },
    // forEach funtion is being applied to the todos array.
    // todo completed isChecked, ajax updates todo

    getActiveTodos: function () {
      return this.todos.filter(todo => !todo.completed);
    },
    getCompletedTodos: function () {
      return this.todos.filter(todo => todo.completed);
    },
    getFilteredTodos: function () {
      if (this.filter === 'active') {
        return this.getActiveTodos();
      }

      if (this.filter === 'completed') {
        return this.getCompletedTodos();
      }

      return this.todos;
    },
     // filter todos that are not completed
     // filter todos that are complete
     // FilteredTodos if equal to active return getActiveTodos
     // if completed retured getCompletedTodos
     // return todos

    destroyCompleted: function () {
      this.getCompletedTodos().forEach(todo => ajax.destroy(todo));
      this.todos = this.getActiveTodos();
      this.filter = 'all';
      this.render();
    },
    // accepts an element from inside the `.item` div and
    // returns the corresponding index in the `todos` array

    indexFromEl: function (el) {
      var id = String($(el).closest('li').data('id'));
      var todos = this.todos;
      var i = todos.length;

      while (i--) {
        if (todos[i].id === id) {
          return i;
        }
      }
    },
     // string of elements closest li with ids
    // while coundting down return the todo equal to id with todos.length

    create: function (e) {
      var $input = $(e.target);
      var val = $input.val().trim();

      if (e.which !== ENTER_KEY || !val) {
        return;
      }

      var uuid = util.uuid();
      this.integrate(uuid, val);
      ajax.create(val, this.replace(uuid, this));

      $input.val('');

      this.render();
    },
    replace: (oldId, context) => {
      return (newTodo) => {
        var todo = context.todos.find((todo) => todo.id === oldId);
        todo.id = newTodo.id;
        util.store('todos-jquery', context.todos);
      }
    },
    toggle: function (e) {
      var i = this.indexFromEl(e.target);
      var todo = this.todos[i];
      todo.completed = !todo.completed;
      ajax.update(todo);
      this.render();
    },
    edit: function (e) {
      var $input = $(e.target).closest('li').addClass('editing').find('.edit');
      $input.val($input.val()).focus();
    },
    editKeyup: function (e) {
      if (e.which === ENTER_KEY) {
        e.target.blur();
      }

      if (e.which === ESCAPE_KEY) {
        $(e.target).data('abort', true).blur();
      }
    },
    update: function (e) {
      var el = e.target;
      var $el = $(el);
      var val = $el.val().trim();

      if (!val) {
        this.destroy(e);
        return;
      }

      if ($el.data('abort')) {
        $el.data('abort', false);
      } else {
        var todo = this.todos[this.indexFromEl(el)];
        todo.title = val;
        ajax.update(todo);
      }

      this.render();
    },
    destroy: function (e) {
      var todo = this.todos.splice(this.indexFromEl(e.target), 1)[0];
      ajax.destroy(todo);
      this.render();
    },
    notIntegrated: function (todo) {
      return !this.todos.map((todo) => todo.id).includes(todo.id);
    },
    integrate: function (id, title, completed) {
      this.todos.push({
        id: id,
        title: title,
        completed: completed || false
      });
    },
    integrateList: function (data) {
      data.filter((todo) => this.notIntegrated(todo))
          .forEach(todo => this.integrate(todo.id,
                                          todo.attributes.id,
                                          todo.attributes['is-complete']));
      this.render();
    }
  };

  App.init();
});
