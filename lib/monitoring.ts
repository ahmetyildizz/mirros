import * as Sentry from "@sentry/nextjs";

export interface GameContext {
  userId?: string;
  roomId?: string;
  gameId?: string;
  gameMode?: string;
  roundNumber?: number;
}

export function captureGameError(error: unknown, context: GameContext, label?: string) {
  console.error(`[${label ?? "game-error"}]`, context, error);
  Sentry.withScope((scope) => {
    scope.setTag("game_mode", context.gameMode ?? "unknown");
    scope.setContext("game", context);
    if (context.userId) scope.setUser({ id: context.userId });
    Sentry.captureException(error);
  });
}

export function captureApiError(error: unknown, route: string, extra?: Record<string, unknown>) {
  console.error(`[api:${route}]`, extra, error);
  Sentry.withScope((scope) => {
    scope.setTag("api_route", route);
    if (extra) scope.setContext("request", extra);
    Sentry.captureException(error);
  });
}
