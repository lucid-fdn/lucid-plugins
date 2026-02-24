import type { PluginConfig } from '../types/config.js';
import type { RecruitProvider } from '../types/provider.js';
import { LinkedInProvider } from './linkedin.js';
import { GitHubProvider } from './github.js';
import { LeverProvider } from './lever.js';
import { GreenhouseProvider } from './greenhouse.js';

export interface ProviderRegistry {
  linkedin: LinkedInProvider;
  github: GitHubProvider;
  lever: LeverProvider;
  greenhouse: GreenhouseProvider;
  all: RecruitProvider[];
  enabled: RecruitProvider[];
}

export function createProviderRegistry(config: PluginConfig): ProviderRegistry {
  const linkedin = new LinkedInProvider(config.linkedinApiKey);
  const github = new GitHubProvider(config.githubToken);
  const lever = new LeverProvider(config.leverApiKey);
  const greenhouse = new GreenhouseProvider(config.greenhouseApiKey);

  const all: RecruitProvider[] = [linkedin, github, lever, greenhouse];
  const enabled = all.filter((p) => p.enabled);

  return { linkedin, github, lever, greenhouse, all, enabled };
}

export { LinkedInProvider } from './linkedin.js';
export { GitHubProvider } from './github.js';
export { LeverProvider } from './lever.js';
export { GreenhouseProvider } from './greenhouse.js';
export { BaseProvider } from './base.js';
