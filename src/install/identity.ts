import { hosts, type HostCapability } from "../hosts.js";
import { err, ok, type Result } from "./fsutil.js";
import type { Env } from "./spawn.js";

function present(env: Env, name: string) {
  return Object.prototype.hasOwnProperty.call(env, name) ? Boolean(env[name]) : Boolean(env === process.env && env[name]);
}

/**
 * Resolves the requesting host from --agent and cross-checks the environment by exact variable name.
 * Messages name variables, never their values.
 */
export function resolveHost(agentArg: string | undefined, env: Env): Result<HostCapability> {
  if (!agentArg) return err(`--agent is required. Use one of: ${hosts.map(host => host.id).join(", ")}.`);
  const host = hosts.find(candidate => candidate.id === agentArg);
  if (!host) return err(`Unknown --agent "${agentArg}". Use one of: ${hosts.map(candidate => candidate.id).join(", ")}.`);
  const own = host.identityEnvironmentVariables.filter(name => present(env, name));
  if (host.identityEnvironmentVariables.length > 0 && own.length === 0) {
    return err(`Host mismatch: --agent ${host.id} requires one of ${host.identityEnvironmentVariables.join(", ")}, and none is set.`);
  }
  if (own.length === 0) {
    const other = hosts.find(candidate => candidate.id !== host.id && candidate.identityEnvironmentVariables.some(name => present(env, name)));
    if (other) {
      const names = other.identityEnvironmentVariables.filter(name => present(env, name));
      return err(`Host mismatch: --agent ${host.id} was requested, but ${names.join(", ")} indicates ${other.id}.`);
    }
  }
  return ok(host);
}
