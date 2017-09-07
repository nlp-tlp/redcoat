# By Michael Stewart
# Takes raw data from a txt file and turns it into HTML/JS so that it may be rapidly tagged.

import json, sys
from colorama import Fore, Style
try:
	from nltk.tokenize import word_tokenizeaaa
except:
	print "Note: NLTK not installed. Tokenising using spaces only."
	print "Please consider installing NLTK for much better results.\n"
	def word_tokenize(line):
		return line.split()

INPUT_FILE  = "raw_data.txt"
OUTPUT_FILE = "json_data.js"

INPUT_ENTITY_CLASSES = "entity_classes.txt"

def throw_error(msg):
	sys.stdout.write("\n" + Fore.RED + "ERROR: " + Style.RESET_ALL + msg + "\n")

with open(INPUT_FILE, 'r') as f:
	lines = f.readlines()
	print "Tokenising all %s lines in the input file..." % len(lines),
	tokenized_sentences = []
	for line in lines:
		tokens = word_tokenize(line)
		tokenized_sentences.append(tokens)
	print "done."

with open(INPUT_ENTITY_CLASSES, 'r') as f:
	print "Converting %s into JSON..." % INPUT_ENTITY_CLASSES,
	lines = f.readlines()
	entity_classes = []
	entity_classes_abbr = []
	if len(lines) > 10:
		throw_error("Unfortunately more than 10 classes are not supported at this stage.")
		exit(0)
	for line in lines:		
		splitline = line.strip().split("\t")
		if len(splitline) != 2:
			throw_error("each line in %s must consist of an entity class, followed by a tab character, followed by the abbreviation." % INPUT_ENTITY_CLASSES)
			exit(0)
		entity_classes.append(splitline[0])
		entity_classes_abbr.append(splitline[1])
	print "done."

with open(OUTPUT_FILE, 'w') as f:
	print "Writing data to %s..." % OUTPUT_FILE,
	f.write("data = ")
	json.dump(tokenized_sentences, f)
	f.write("\nentity_classes = ")
	json.dump(entity_classes, f)
	f.write("\nentity_classes_abbr = ")
	json.dump(entity_classes_abbr, f)
	print "done."