const fs = require('fs');
const rimraf = require('rimraf');
const unzipper = require('unzipper');
const uniqid = require('uniqid');

class SRXD {
    constructor() {
        this.backupLocation = "";
        this.srtbLocation = "";
        this.songTrackInfo = {};
        this.songLocation = "";
    }

    // Extract a local backup folder
    async extractBackup(filePath, fileName) {
        if(this.backupLocation != "") {
            console.log("Unload previous Backup.");
            this.unloadBackup();
        }
    
        console.log("Extracting Backup.");
    
        this.backupLocation = path.join(tempDirLocation, "extract-" + uniqid());
        console.info(this.backupLocation);
    
        // Unzip to temp/CustomSpeens/Song
        await fs.createReadStream(filePath).pipe(unzipper.Extract({ path: this.backupLocation })).promise();
    
        console.log("Loading Backup.");
    
        // Find SRTB & OGG files
        let srtbFilesInBackupLocation = this.getFilesFromPath(this.backupLocation, ".srtb");
    
        if(srtbFilesInBackupLocation.length < 1) {
            console.error("No SRTB file found in backup.");
            return false;
        }
    
        // Load SRTB file
        this.srtbLocation = path.join(this.backupLocation, srtbFilesInBackupLocation[0]);
        let srtbFile = JSON.parse( fs.readFileSync(this.srtbLocation) );
        let songTrackInfo = "";

        srtbFile.largeStringValuesContainer.values.forEach(function(value) {
            if(value.key == "SO_TrackInfo_TrackInfo") {
                songTrackInfo = value.val;
            }
        });

        this.songTrackInfo = songTrackInfo;
    
        // Load OGG file
        let oggFilesInBackupLocation = this.getFilesFromPath(path.join(this.backupLocation, "AudioClips"), ".ogg");
        this.songLocation = path.join(this.backupLocation, oggFilesInBackupLocation[0]);
    
        // TODO: Backup Validation
        return this.backupLocation;
    }

    async unloadBackup() {
        // Remove temp files
        console.log("Removing Backup Folder: " + this.backupLocation);
        try {
            rimraf(this.backupLocation, function() { console.log("Removed backup folder."); });
        } catch(error) {
            console.error(error);
        }
    
        // Reset vars
        this.backupLocation = "";
        this.srtbLocation = "";
        this.songTrackInfo = {};
        this.songLocation = "";
    }

    getSongDetail(srtbPath) {
        let srtbFile = JSON.parse( fs.readFileSync(srtbPath) );
        let songTrackInfo = "";

        srtbFile.largeStringValuesContainer.values.forEach(function(value) {
            if(value.key == "SO_TrackInfo_TrackInfo") {
                songTrackInfo = JSON.parse( value.val );
            }
        });

        return [songTrackInfo, this.getSongCover(songTrackInfo.albumArtReference.assetName)];
    }

    // Used to find files by file extension
    // by https://stackoverflow.com/a/52024318
    getFilesFromPath(path, extension) {
        let dir = fs.readdirSync( path );
        return dir.filter( elm => elm.match(new RegExp(`.*\.(${extension})$`, 'ig')));
    }
    getLocalSongs(path) {
        let dir = fs.readdirSync( path );
        return dir.filter( elm => elm.match(new RegExp(`.*\.srtb$`, 'ig')));
    }
    getSongCover(fileName) {
        let dir = fs.readdirSync( path.join(userSettings.get('gameDirectory'), "AlbumArt") );
        let fileExtension = dir.filter( elm => elm.match(new RegExp(`(${fileName}).*\.$`, 'ig')));
    
        let finalPath = path.join(userSettings.get('gameDirectory'), "AlbumArt", fileExtension[0]);
    
        let base64Data = "data:image/jpg;base64," + fs.readFileSync(finalPath, { encoding: 'base64' });
    
        return base64Data;
    }
    getSongTrackInfo() {
        return this.songTrackInfo;
    }
}

module.exports = SRXD;