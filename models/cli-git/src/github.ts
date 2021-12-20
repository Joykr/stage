import { AxiosPromise } from 'axios';
import GitServer from './git-server';
import GithubRequest from './github-request';

export default class Github extends GitServer {
  request: GithubRequest | null;
  constructor() {
    super('github');
    this.request = null;
  }

  setToken(token: string): void {
    super.setToken(token);

    this.request = new GithubRequest(token);
  }

  getUser() {
    return this.request?.get('/user');
  }

  getOrg() {
    return this.request?.get(`/user/orgs`, {
      page: 1,
      per_page: 100
    })
  }

  getRepo(loginName: string, projectName: string) {
    return this.request
      ?.get(`/repos/${loginName}/${projectName}`)
      .then(res => {
        return this.handleResponse(res);
      });
  }

  createRepo(projectName: string) {
    return this.request?.post('/user/repos', {
      name: projectName,
    }, {
      Accept: 'application/vnd.github.v3+json'
    });
  }

  createOrgRepo(loginName: string, projectName: string) {
    return this.request?.post(`/orgs/${loginName}/repos`, {
      name: projectName
    }, {
      Accept: 'application/vnd.github.v3+json'
    });
  }

  getTokenUrl() {
    return 'https://github.com/settings/tokens';
  }

  getTokenHelpUrl() {
    return 'https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh';
  }

  getRemote(loginName: string, projectName: string) {
    return `git@github.com:${loginName}/${projectName}.git`
  }
}
