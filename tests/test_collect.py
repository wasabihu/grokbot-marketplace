import sys
from pathlib import Path
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from collect import resolve, flight
class FlightTests(unittest.TestCase):
    def test_adjacent_records_and_utf8_byte_length(self):
        # A text record can end with hex characters and immediately precede the next ID.
        stream='0:{}\na:T6,中文b:T3,abcc:T4,test'
        self.assertEqual(resolve(['$a','$b','$c'],stream),['中文','abc','test'])
    def test_literal_record_looking_text_inside_value(self):
        value='example 1:T4,fake'
        stream=f'a:T{len(value.encode()):x},{value}b:T4,real'
        self.assertEqual(resolve({'value':'$a','next':'$b'},stream),{'value':value,'next':'real'})
    def test_missing_reference_fails_instead_of_silently_dropping_content(self):
        with self.assertRaises(ValueError):resolve({'text':'$ff'},'0:{}\n')
if __name__=='__main__':unittest.main()
