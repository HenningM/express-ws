### v2.0

* __[BREAKING]__ Now supports Express Routers as well. A side-effect of this is that the Router prototype is modified to add a `.ws` method - in rare cases, this may interfere with existing code that relies on the Router prototype either remaining unchanged, or adding its own `.ws` method to it.

  A `leaveRouterUntouched` option has been added to prevent this behaviour; see the API documentation for more information.

* [minor] You can now add `.ws` functionality to any custom Router object that follows the Express Router API.
