import {
  MiddlewareAPI,
  AnyAction,
  Action,
  Dispatch,
  Middleware,
  Store,
  Reducer
} from "redux";

export const TURTLES_TYPE = "TURTLES_ALL_THE_WAY_DOWN";

export interface TurtlesAction extends Action<typeof TURTLES_TYPE> {
  type: typeof TURTLES_TYPE;
  values: [string, any][];
}

export interface TurtleOptions<T_PARENT_STATE> {
  parentStore: Store<T_PARENT_STATE>;
  keysToCopy?: (keyof T_PARENT_STATE)[];
  actionsToForward?: Set<string>;
}

export function createTurtleMiddleware<P, C>(
  opts: TurtleOptions<P>
): Middleware<any, C> {
  const actionsToForward = opts.actionsToForward || new Set();
  const keysToForward = opts.keysToCopy || [];

  return (store: MiddlewareAPI<any, C>) => {
    opts.parentStore.subscribe(() => {
      const parentState = opts.parentStore.getState();
      store.dispatch({
        type: TURTLES_TYPE,
        values: keysToForward.map(k => [k, parentState[k]])
      } as TurtlesAction);
    });

    return (next: Dispatch<AnyAction>) => (action: Action) => {
      if (actionsToForward.has(action.type)) {
        opts.parentStore.dispatch(action);
      } else {
        next(action);
      }
    };
  };
}

export function reduceTurtles<S = any>(reducer: Reducer<S>) {
  return function(state: S | undefined, action: TurtlesAction | never) {
    if (action.type === TURTLES_TYPE) {
      if (state === undefined) {
        state = {} as S;
      }

      const causesChange = action.values.some(
        ([k, v]) => (state as any)[k] !== v
      );

      if (causesChange) {
        return Object.assign(
          {},
          state,
          ...action.values.map(([k, v]) => ({ [k]: v }))
        );
      }
    }

    return state;
  };
}
