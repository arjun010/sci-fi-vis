from __future__ import unicode_literals
import sys,os,csv,json
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import spacy
from spacy import displacy
from collections import Counter
import en_core_web_sm

outputMap = {}
bookId = 0

sentimentAnalyzer = SentimentIntensityAnalyzer()
nlp = en_core_web_sm.load()

def get_sentiment_score(sentence):
    scores = sentimentAnalyzer.polarity_scores(sentence)
    # print("{:-<40} {}".format(sentence, str(score)))
    return scores['compound']

for book in os.listdir('../raw-data'):
	outputMap[book] = {
		"id" : 'b'+str(bookId),
		"year" : "",
		"author" : "",
		"chapters" : []
	}
	for chapter in os.listdir('../raw-data/'+book+'/'):
		chapterId = outputMap[book]['id']+'-c'+chapter.split("--")[0]
		with open('../raw-data/'+book+'/'+chapter,"rb") as file:
			chapterText = file.read()
			chapterText = str(chapterText, 'utf-8')
			chapterText = chapterText.replace("\r\n"," ")
		
		chapterSentimentScore = get_sentiment_score(chapterText)
		doc = nlp(chapterText)
		chapterEntityMap = {}
		for X in doc.ents:
			if X.label_ in ['NORP','ORDINAL']:
				continue
			if X.label_ in chapterEntityMap:
				if X.text not in chapterEntityMap[X.label_]['values']:
					chapterEntityMap[X.label_]['count'] += 1
					chapterEntityMap[X.label_]['values'].append(X.text)
			else:
				chapterEntityMap[X.label_] = {
					'count' : 1,
					'values' : [X.text]
				}

		chapterObj = {
			"id" : chapterId,
			"title" : chapter.split(".txt")[0],
			"sentimentScore" : chapterSentimentScore,
			"wordCount" : len(chapterText.split(' ')),
			"entityMap" : chapterEntityMap
		}
		outputMap[book]['chapters'].append(chapterObj)

	bookId += 1

with open('../converted-data/dataMap.json', 'w') as outfile:
    json.dump(outputMap, outfile, indent=1)