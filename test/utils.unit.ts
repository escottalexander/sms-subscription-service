import * as sinon from "sinon";
import * as chai from "chai";
const expect = chai.expect;
import { messageContainsUnicode, replaceCommonUnicode, getSegments } from '../src/utils';


describe('messageContainsUnicode', () => {
    it('should return true when message contains unicode characters such as emojis', () => {
        const message = 'This is a test message with unicode: 😊';
        const result = messageContainsUnicode(message);
        expect(result).to.equal(true);
    });

    it('should return true when message contains unicode characters such as dot', () => {
        const message = 'This is a test message with unicode: •';
        const result = messageContainsUnicode(message);
        expect(result).to.equal(true);
    });

    it('should return false when message does not contain unicode characters', () => {
        const message = 'This is a test message without unicode ... \' \' - - - ~ " "    \' - < > << >> ^';
        const result = messageContainsUnicode(message);
        expect(result).to.equal(false);
    });
});

describe('replaceCommonUnicode', () => {
    it('should replace common unicode characters in the message', () => {
        const message = 'This is a test message with common unicode characters: … ‘ ’ • – — ˜ “ ” ™ 	 ´ · ‹ › « » ˆ';
        const expected = 'This is a test message with common unicode characters: ... \' \' - - - ~ " "    \' - < > << >> ^';
        const result = replaceCommonUnicode(message);
        expect(result).to.equal(expected);
    });

    it('should not replace any characters when the message does not contain common unicode characters', () => {
        const message = 'This is a test message without common unicode characters';
        const result = replaceCommonUnicode(message);
        expect(result).to.equal(message);
    });
});

describe('getSegments', () => {
    it('should return the correct number of segments when the message contains unicode characters', () => {
        const message = 'This is a test message with unicode: 😊';
        const expected = 1;
        const result = getSegments(message);
        expect(result).to.equal(expected);
    });

    it('should return the correct number of segments when the message does not contain unicode characters and is length 160', () => {
        const message = '0'.repeat(160);
        const expected = 1;
        const result = getSegments(message);
        expect(result).to.equal(expected);
    });

    it('should return the correct number of segments when the message does not contain unicode characters and is length 161', () => {
        const message = '0'.repeat(161);
        const expected = 2;
        const result = getSegments(message);
        expect(result).to.equal(expected);
    });
    it('should return the correct number of segments when the message does not contain unicode characters and is length 480', () => {
        const message = '0'.repeat(480);
        const expected = 3;
        const result = getSegments(message);
        expect(result).to.equal(expected);
    });

    it('should return the correct number of segments when the message length is a multiple of 70', () => {
        const message = 'This message contains unicode but is less than 70 in length 😊';
        const expected = 1;
        const result = getSegments(message);
        expect(result).to.equal(expected);
    });

    it('should return the correct number of segments when the message length is greater than 70', () => {
        const message = 'This is a test message with more than 70 characters. This message should be split into two segments. Unicode: ™';
        const expected = 2;
        const result = getSegments(message);
        expect(result).to.equal(expected);
    });
    it('should return the correct number of segments when the message length is 210', () => {
        const message = '™'.repeat(210);
        const expected = 3;
        const result = getSegments(message);
        expect(result).to.equal(expected);
    });
});