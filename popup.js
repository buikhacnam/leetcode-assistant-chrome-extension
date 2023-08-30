async function getActiveTabURL() {
  const tabs = await chrome.tabs.query({
      currentWindow: true,
      active: true
  });

  return tabs[0];
}
document.addEventListener('DOMContentLoaded', async () => {
	const activeTab = await getActiveTabURL()
	const problemSlug = activeTab.url.slice(0, activeTab.url.length - 1).split('/').pop()
	if (activeTab.url.includes('https://leetcode.com/problems/')) {
		const container = document.getElementsByClassName('container')[0]

		container.innerHTML = `<a href="http://localhost:3000/experiments/${problemSlug}">View Solution</a>`
    addPopupToLinks(container, problemSlug)
	} else {
		const container = document.getElementsByClassName('container')[0]

		container.innerHTML =
			'<div class="title">Visit leetcode.com/problems/[problem-name] to use the extension.</div>'
	}

  const savedLinksContainer = document.querySelector('.saved-links');

  // Retrieve the saved links from Chrome storage and render them
  chrome.storage.local.get({ links: [] }, (result) => {
      const savedLinks = result.links;
      renderSavedLinks(savedLinks, savedLinksContainer);
  });
})

function addPopupToLinks(container, problemSlug) {
	var links = container.getElementsByTagName('a')
	for (var i = 0; i < links.length; i++) {
		;(function () {
			var ln = links[i]
			var location = ln.href
			ln.onclick = function () {
				// chrome.tabs.create({active: true, url: location});
				// pop up to a small new window

        saveClickedLink(location, problemSlug);


				chrome.windows.create({
					url: location,
					type: 'popup',
					height: 800,
					width: 800,
				})
			}
		})()
	}
}


function saveClickedLink(link, problemSlug) {
  chrome.storage.local.get({ links: [] }, (result) => {
      const { links } = result;
      links.push({ link, problemSlug });
      
      chrome.storage.local.set({ links }, () => {
          console.log('Link saved:', link);
      });
  });
}

function renderSavedLinks(links, container) {
  if (links.length === 0) {
      container.innerHTML = '<div class="no-links">No links saved yet.</div>';
  } else {
      const list = document.createElement('ul');
      list.classList.add('link-list');

      for (const linkData of links) {
          const listItem = document.createElement('li');
          const link = document.createElement('a');
          link.href = '#'; // Set href to '#' for event handling
          link.textContent = linkData.problemSlug;

          // Add a click event listener to open the link in a popup window
          link.addEventListener('click', (event) => {
              event.preventDefault();
              openPopup(linkData.link);
          });

          // Add a delete button for each link
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.addEventListener('click', () => {
              deleteLink(linkData);
              renderSavedLinks(links, container); // Re-render the list after deletion
          });


          listItem.appendChild(link);
          listItem.appendChild(deleteButton);
          list.appendChild(listItem);
      }

      container.innerHTML = ''; // Clear existing content
      container.appendChild(list);
  }
}

function openPopup(link) {
  chrome.windows.create({
      url: link,
      type: 'popup',
      height: 800,
      width: 800,
  });
}

function deleteLink(linkData) {
  chrome.storage.local.get({ links: [] }, (result) => {
      const { links } = result;
      const updatedLinks = links.filter(link => link.link !== linkData.link);
      
      chrome.storage.local.set({ links: updatedLinks }, () => {
          console.log('Link deleted:', linkData.link);
          
          // After deletion, re-render the list
          renderSavedLinks(updatedLinks, document.querySelector('.saved-links'));
      });
  });
}
