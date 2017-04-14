import mirageInitializer from 'nypr-audio-services/initializers/ember-cli-mirage';

export default function startMirage(container) {
  mirageInitializer.initialize(container);
}
