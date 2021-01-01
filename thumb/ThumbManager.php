<?php

include('SimpleImage.php');

class ThumbManager {
    
    public $size = 200;
    
    protected $si = NULL;
    
    protected $thumbdir = null;
    
    public function ThumbManager($thumbdir) {
        $this->thumbdir = $thumbdir;
        $this->thumbdir = rtrim($this->thumbdir, '/');
        $this->thumbdir = rtrim($this->thumbdir, '\\');
        $this->si = new SimpleImage();
    }
	
	public function getThumbFile($infile, $outfile = NULL, $context = NULL) {
        if (!$outfile) {
            $outfile = $this->getThumbPath($infile, $context);
        }
		if ( $this->thumbDo($infile, $outfile) ) {
			return $outfile;
		} else {
            if ( file_exists($infile) ) {
			    return $infile;
            } else {
                return '';
            }
		}
	}
    public function getThumbFromID($id, $context) {
        if (!$this->thumbdir) { return false; }
        if (!$context) { $context = 'generic'; }
        $context = strtolower($context);
        
        $contextdir = $this->thumbdir.DIRECTORY_SEPARATOR.$context.DIRECTORY_SEPARATOR;
        if (!is_dir($contextdir)) {
            mkdir($contextdir, 0777, true);
        }
        return $contextdir.'/'.$id.'.jpg';
    }
    public function getInfileID($infile, $context) {
        if (!$context) { $context = 'generic'; }
        $context = strtolower($context);
        return substr(sha1($infile.$context.$this->size),0,16);
    }
    
    protected function getThumbPath($infile, $context = NULL) {
        if (!$this->thumbdir) { return false; }
        if (!$context) { $context = 'generic'; }
        $context = strtolower($context);
        
        $contextdir = $this->thumbdir.DIRECTORY_SEPARATOR.$context.DIRECTORY_SEPARATOR;
        if (!is_dir($contextdir)) {
            mkdir($contextdir, 0777, true);
        }
        return $contextdir.'/'.$this->getInfileID($infile, $context).'.jpg';
    }
    
    protected function thumbDo($infile, $outfile) {
        if (!$outfile) { return false; }
        if ( file_exists($outfile) && filemtime($outfile) >= filemtime($infile) ) {
            return true;
        }
        if ( !file_exists($infile) ) {
            return false;
        }
        try {
            $this->si->load($infile);
            $this->si->resizeToWidth($this->size);
            $this->si->save($outfile);
            return true;
        } catch(Exception $e) {
            die($e);
            return false;
        }
    }
    
};






?>