import { createTurtleMiddleware, TurtleOptions, reduceTurtles } from "./";
import {
  createStore,
  AnyAction,
  applyMiddleware,
  MiddlewareAPI,
  Store,
  Action
} from "redux";
import { update } from "copy-machine";

const doNothingReducer = (s: any, a: any) => {
  return s;
};

const FOO = "foo";
type FOO = typeof FOO;
const BAR = "bar";
type BAR = typeof BAR;

describe("createTurtleMiddleware", () => {
  const fooAction: Action<FOO> = { type: FOO };
  const barAction: Action<BAR> = { type: BAR };

  interface State {
    foos: {
      count: number;
    };
    bars: {
      count: number;
    };
  }

  function rootReducer(state: State | undefined, action: Action<any>) {
    if (state === undefined) {
      state = {
        foos: {
          count: 0
        },
        bars: {
          count: 0
        }
      };
    }

    if (action.type === FOO) {
      return {
        ...state,
        foos: {
          count: state.foos.count + 1
        }
      };
    } else if (action.type === BAR) {
      return {
        ...state,
        bars: {
          count: state.bars.count + 1
        }
      };
    }

    return state;
  }

  let parentStore: Store<State>;
  let childStore: Store<State>;

  beforeEach(() => {
    parentStore = createStore(rootReducer);
    parentStore.dispatch = jest.fn<typeof parentStore.dispatch>(
      parentStore.dispatch
    );
    childStore = createStore<State, any, {}, {}>(
      reduceTurtles(rootReducer),
      applyMiddleware(
        createTurtleMiddleware({
          parentStore,
          keysToCopy: ["foos"],
          actionsToForward: new Set([FOO])
        })
      )
    );
  });

  it("forwards messages to parent", () => {
    childStore.dispatch(fooAction);

    expect(parentStore.dispatch).toHaveBeenCalledWith(fooAction);
  });

  it("doesnt forward other messages to parent", () => {
    childStore.dispatch(barAction);

    expect(parentStore.dispatch).not.toHaveBeenCalledWith(fooAction);
    expect(parentStore.getState().bars.count).toBe(0);
  });

  it("copies parent value to child", () => {
    parentStore.dispatch(fooAction);
    parentStore.dispatch(fooAction);

    expect(childStore.getState().foos.count).toBe(2);
  });

  it("copies parent value to child and forwards", () => {
    parentStore.dispatch(fooAction);
    childStore.dispatch(fooAction);
    parentStore.dispatch(fooAction);

    expect(childStore.getState().foos.count).toBe(3);
  });

  it("doesnt cause unnecessary updates", () => {
    parentStore.dispatch(fooAction);

    const origState = childStore.getState();
    parentStore.dispatch(barAction);
    expect(childStore.getState()).toBe(origState);

    parentStore.dispatch(fooAction);
    expect(childStore.getState()).not.toBe(origState);
  });
});
