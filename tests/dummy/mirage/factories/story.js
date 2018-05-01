import { Factory, faker } from 'ember-cli-mirage';

export default Factory.extend({
  slug(id) {
    return `story-${id}`;
  },
  itemTypeId: 24,
  itemType: 'story',
  headers() {
    return {};
  },
  title(id) {
    return `Story ${id}`;
  },
  extendedStory() {
    return {
      body: 'Story body.'
    }
  },
  commentsEnabled: true,
  dateLineDatetime: faker.date.recent,
  audio: () => faker.internet.url() + '.mp3',
});
