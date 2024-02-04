
var loadingSpinner = document.getElementById('loading-spinner');
var fullScreenModal = document.getElementById('fullScreenModal');
var fullScreenImage = document.getElementById('fullScreenImage');
var photos = [];
var currentPhotoIndex = 0;

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC7D7TlhKlfG4qEScY8SGN_wvm5TGZNXQk",
  authDomain: "formeheaven-d9bb7.firebaseapp.com",
  projectId: "formeheaven-d9bb7",
  storageBucket: "formeheaven-d9bb7.appspot.com",
  messagingSenderId: "296689944479",
  appId: "1:296689944479:web:f028c86696f9506b2a9faa",
  measurementId: "G-9BZVGWEXCM"
};

firebase.initializeApp(firebaseConfig);

var storage = firebase.storage();
var alertShown = false;

function uploadFile(file, path) {
    return new Promise(function (resolve, reject) {
        var storageRef = storage.ref(path);
        var task = storageRef.put(file);

        var progressBar = document.querySelector('.upload-progress');
        progressBar.style.display = 'block';

        task.on(
            'state_changed',
            function progress(snapshot) {
                var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressBar.value = percentage;
            },
            function error(err) {
                console.log('Upload failed:', err);
                alert('Upload failed: ' + err.message);
                progressBar.style.display = 'none';
                reject(err);
            },
            function complete() {
                console.log('Upload complete');
                progressBar.style.display = 'none';
                resolve();
            }
        );
    });
}

document.querySelector('#select-all-btn').addEventListener('click', function () {
    var checkboxes = document.querySelectorAll('.photo-checkbox');
    var selectAll = !checkboxes[0].checked;

    checkboxes.forEach(function (checkbox) {
        checkbox.checked = selectAll;
    });

    updateDeleteButtonState();
});

document.querySelector('#upload-form').addEventListener('submit', function (e) {
    e.preventDefault();
    uploadFiles();
});

function uploadFiles() {
    var fileInput = document.getElementById('photo');
    var files = fileInput.files;

    if (files.length === 0) {
        console.log('No files selected');
        return;
    }

    var promises = Array.from(files).map(file => {
        var photoPath = 'photos/' + file.name;
        var backupPath = 'backup/' + file.name;

        // Upload to 'photos' folder
        var photoUploadPromise = uploadFile(file, photoPath);

        // Upload to 'backup' folder
        var backupUploadPromise = uploadFile(file, backupPath);

        // Promise.all to wait for both uploads to complete
        return Promise.all([photoUploadPromise, backupUploadPromise]);
    });

    Promise.all(promises)
        .then(() => {
            console.log('All uploads complete');
            alert('All uploads complete! ❤️🥰🙈🙈');
            getPhotos();
            document.querySelector('.upload-progress').style.display = 'none';
            fileInput.value = '';
        })
        .catch(error => {
            console.error('Error during uploads:', error);
            alert('Error during uploads: ' + error.message);
            document.querySelector('.upload-progress').style.display = 'none';
        });
}

function getPhotos() {
    loadingSpinner.style.display = 'block';
    var photosRef = storage.ref('photos');
    photosRef.listAll().then(function (result) {
        var html = '';
        photos = []; // Clear the photos collection before updating it
        result.items.forEach(function (photoRef, index) {
            photoRef.getDownloadURL().then(function (url) {
                html += '<div class="photo-container"><input type="checkbox" class="photo-checkbox" value="' + photoRef.fullPath + '"><img src="' + url + '" class="photo" onclick="openFullScreenModal(\'' + url + '\',' + index + ')"></div>';
                document.querySelector('#photos').innerHTML = html;
                photos.push({ src: url }); // Add each photo URL to the photos collection
            });
        });
        loadingSpinner.style.display = 'none';
    }).catch(function (error) {
        console.log('Error getting photos:', error);
        alert('Error getting photos: ' + error.message);
        loadingSpinner.style.display = 'none';
    });
}

getPhotos();

document.querySelector('#delete-btn').addEventListener('click', function () {
    var checkboxes = document.querySelectorAll('.photo-checkbox:checked');
    var checkedPaths = Array.from(checkboxes).map(function (checkbox) {
        return checkbox.value;
    });

    if (checkedPaths.length > 0) {
        if (confirm('Are you sure you want to delete the selected photos? 👀⁉️')) {
            var promises = checkedPaths.map(function (path) {
                return storage.ref(path).delete();
            });

            Promise.all(promises)
                .then(function () {
                    alert('Selected photos deleted successfully!👍');
                    location.reload();
                })
                .catch(function (error) {
                    console.log('Error deleting photos:', error);
                    alert('Error deleting photos: ' + error.message);
                });
        }
    }
});


document.addEventListener('change', function (e) {
    if (e.target.classList.contains('photo-checkbox')) {
        updateDeleteButtonState();
    }
});



function updateDeleteButtonState() {
    var checkboxes = document.querySelectorAll('.photo-checkbox');
    var deleteBtn = document.querySelector('#delete-btn');
    var checkedCount = 0;
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            checkedCount++;
        }
    }
    deleteBtn.disabled = checkedCount === 0;
}

document.addEventListener('DOMContentLoaded', function () {
    const closeBtn = document.getElementById('fullScreenCloseBtn');
    closeBtn.addEventListener('click', closeFullScreenModal);
});

function openFullScreenModal(url, index) {
    fullScreenImage.src = url;
    currentPhotoIndex = index;
    fullScreenModal.style.display = 'flex';

    // Remove the previous event listener to avoid multiple listeners
    fullScreenImage.removeEventListener('click', handleFullScreenClick);

    // Add the new event listener
    fullScreenImage.addEventListener('click', handleFullScreenClick);
}
var navigationInProgress = false;

function handleFullScreenClick(event) {
    if (navigationInProgress) {
        return; // Ignore click if navigation is already in progress
    }

    var rect = fullScreenImage.getBoundingClientRect();
    var clickX = event.clientX - rect.left;
    var threshold = rect.width / 2;

    navigationInProgress = true;

    if (clickX < threshold) {
        navigateFullScreenModal('ArrowLeft');
    } else {
        navigateFullScreenModal('ArrowRight');
    }

    // Use transitionend event to reset the navigation flag
    if (fullScreenImage) {
        fullScreenImage.addEventListener('transitionend', function onTransitionEnd() {
            navigationInProgress = false;
            fullScreenImage.removeEventListener('transitionend', onTransitionEnd);
        });
    } else {
        navigationInProgress = false;
    }
}





fullScreenImage.addEventListener('click', handleFullScreenClick);
fullScreenImage.addEventListener('mousedown', function (event) {
    var rect = fullScreenImage.getBoundingClientRect();
    var clickX = event.clientX - rect.left;
    var threshold = rect.width / 2;

    if (clickX < threshold) {
        // Clicked on the left side, navigate to the previous image
        navigateFullScreenModal('ArrowLeft');
    } else {
        // Clicked on the right side, navigate to the next image
        navigateFullScreenModal('ArrowRight');
    }
});

function navigateFullScreenModal(direction) {
    var newIndex;

    if (direction === 'ArrowLeft') {
        newIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
    } else if (direction === 'ArrowRight') {
        newIndex = (currentPhotoIndex + 1) % photos.length;
    }

    var newUrl = photos[newIndex].src;
    currentPhotoIndex = newIndex;
    fullScreenImage.src = newUrl;
}

function closeFullScreenModal() {
    fullScreenModal.style.display = 'none';
}

// Toggle dark background on button click or any other event
document.getElementById('toggle-dark-mode-btn').addEventListener('click', function () {
    document.body.classList.toggle('dark-background');
});


