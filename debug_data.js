import localforage from 'localforage';

localforage.config({
  name: 'SpaceGestao',
  storeName: 'space_gestao_data'
});

async function debug() {
  const os = await localforage.getItem('os') || [];
  const collaborators = await localforage.getItem('collaborators') || [];
  const projects = await localforage.getItem('projects') || [];
  
  console.log('--- OS ---');
  console.log(JSON.stringify(os.slice(0, 3), null, 2));
  console.log('Count:', os.length);
  
  console.log('--- Collaborators ---');
  console.log(JSON.stringify(collaborators.slice(0, 3), null, 2));
  
  console.log('--- Projects ---');
  console.log(JSON.stringify(projects.slice(0, 3), null, 2));
}

debug();
