/**
 * Git Gogs Coding Plugin for OpenCode.ai
 *
 * Auto-registers the skills directory so OpenCode discovers
 * git-gogs-coding-plugin skills without manual symlinks.
 */

import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const GitGogsCodingPlugin = async () => {
  const skillsDir = path.resolve(__dirname, '../../plugins/git-gogs-coding-plugin/skills');

  return {
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
    }
  };
};
