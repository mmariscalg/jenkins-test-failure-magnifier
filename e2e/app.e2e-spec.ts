import { Prototipo2Page } from './app.po';

describe('prototipo2 App', () => {
  let page: Prototipo2Page;

  beforeEach(() => {
    page = new Prototipo2Page();
  });

  it('should display welcome message', done => {
    page.navigateTo();
    page.getParagraphText()
      .then(msg => expect(msg).toEqual('Welcome to app!!'))
      .then(done, done.fail);
  });
});
