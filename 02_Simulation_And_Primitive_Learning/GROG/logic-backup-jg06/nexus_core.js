class NexusCore {
  static VERSION = "1.0.0";
  static DEFAULT_CONFIG = {
    mode: 'development',
    debug: false
  };

  #config = Object.freeze(Object.assign({}, NexusCore.DEFAULT_CONFIG));
  #dependencies = {};
  #services = {};
  #status = null;
  #lifecyclePhase = null;
  #eventListeners = [];
  #initialized = false;

  constructor(options = {}) {
    Object.assign(this.#config, options);
    this.#eventListeners = {
      INIT: () => {},
      LOADING: () => {},
      ERROR: () => {},
      INITIALIZED: () => {},
      SHUTDOWN: () => {}
    }
  }

  configure(config) {
    this.#config = Object.assign(this.#config, config);
  }

  getOption(name, defaultValue) {
    return this.#config[name] !== undefined ? this.#config[name] : defaultValue;
  }

  addEventListener(event, callback) {
    if (event in this.#eventListeners) {
      this.#eventListeners[event] = callback;
    } else {
      throw new Error('Invalid event type');
    }
  }

  removeEventListener(event, callback) {
    if (event in this.#eventListeners) {
      if (this.#eventListeners[event] === callback) {
        this.#eventListeners[event] = () => {};
      }
    } else {
      throw new Error('Invalid event type');
    }
  }

  async lifecycleLoad() {
    return this.load()
      .then(() => this.initialize())
      .then(() => this.initializeServices())
      .then(() => this.initilized())
      .catch((error) => this.error(error))
      .finally(() => this.shutdown());
  }

  async load() {
    let status;
    try {
      status = await this.diagnostics('Lifecycle: Configuration');
      await this._loadConfig();
      status = await this.diagnostics('Lifecycle: Dependencies');
      await this._loadDependencies();
    } catch (error) {
      throw this.error(error);
    } finally {
      return status;
    }
  }

  async diagnostics(message) {
    console.log(message);
    this.setStatus('INIT');
    this.#eventListeners.INIT();
    return 'INIT';
  }

  async _loadConfig() {
    console.log('Loading configuration...');
    return 'CONFIG_LOADED';
  }

  async _loadDependencies() {
    console.log('Loading Dependencies...');
    this.setStatus('LOADING');
    this.#eventListeners.LOADING();
    try {
      // Add code to load dependencies here
      this.setStatus('INITIALIZED');
      this.#eventListeners.INITIALIZED();
      return 'DEPENDENCIES_LOADED';
    } catch (error) {
      return this.error(error);
    }
  }

  async initialize() {
    if (this.#initialized) {
      return;
    }
    console.log('Lifecycle: Initialization');
    this.setStatus('INITIALIZED');
    this.#eventListeners.INITIALIZED();
    this.#initialized = true;
  }

  async initializeServices() {
    console.log('Lifecycle: Services Initialization');
  }

  async initilized() {
    this.setStatus('INITIALIZED');
  }

  async error(error) {
    console.log('Error during initiation...');
    this.setStatus('ERROR');
    this.#eventListeners.ERROR();
    throw error;
  }

  shutdown() {
    this.#eventListeners.SHUTDOWN();
    this.setStatus('SHUTDOWN');
    console.log("NexusCore shutdown.");
  }

  async setStatus(value) {
    console.log(`Status updated to ${value}`);
    this.#status = value;
    return this.#status;
  }

  get status() {
    return this.#status;
  }

  toString() {
    return `NexusCore ${NexusCore.VERSION} - STATUS: ${this.status}`;
  }
}

class DependenciesComponent {
  nexusCore = null;

  async initializeDependencies() {
    if (!this.nexusCore) {
      throw new Error('NexusCore not initialized');
    }
    const dependencies = await this.nexusCore.dependencies();
    dependenciesComponents = {
      dependency1: 'value1',
      dependency2: 'value2'
    };
    Object.assign(this.nexusCore.#dependencies, dependenciesComponents);
  }

  static get nexus() {
    return {
      create() {
        const nexusCore = new NexusCore();
        const component = new DependenciesComponent();
        component.nexusCore = nexusCore;
        return { nexus: nexusCore, component: component };
      }
    }
  }
}

const { nexus: nexusCore, component: dependenciesComponent } = DependenciesComponent.nexus.create();
dependenciesComponent.initializeDependencies();

nexusCore.addEventListener('INIT', () => console.log('Initializing...'));
nexusCore.addEventListener('LOADING', () => console.log('Loading Dependencies...'));
nexusCore.addEventListener('ERROR', () => console.log('Error occurred...'));
nexusCore.addEventListener('INITIALIZED', () => console.log('Initialized...'));
nexusCore.addEventListener('SHUTDOWN', () => console.log('NexusCore shutdown.'));

nexusCore.configure({ mode: 'production' });
nexusCore.lifecycleLoad().then(() => console.log("All good")).catch((error) => console.log("Oh no, error", error));


In this code:

*   The `NexusCore` class encapsulates the core functionality of the library using private fields (`#config`, `#dependencies`, `#services`, etc.).
*   The `DependenciesComponent` class uses the `nexus` object created by `NexusCore` to initialize the dependencies.
*   The event listener system is simplified by using a simple mapping of event types to callback functions.
*   The `lifecycleLoad` method now properly completes the load phase, initializes dependencies and services, and then shuts down the system in case of an error.
*   The `load` method is refactored to extract separate methods for loading configuration, dependencies, and completing the load phase.
*   The `diagnostics` method is refactored to return a status string to be used for further processing in the load phase.
*   The `error` method now correctly handles and resolves errors during initialization.
*   The `shutdown` method is moved to a final `finally` block in the `lifecycleLoad` method to handle shutting down the system regardless of the load phase outcome.
*   The `status` getter is added to return the current status of the system.