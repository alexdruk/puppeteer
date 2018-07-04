#!/Perl/bin/perl -w
###################################################################
### to create an empty table for optimum reports
###
###################################################################

my $DEBUG=0;
use strict;

my $dir = '/Users/alex/Documents/puppeteer/res/';
my $outfile = './res/result.csv';
opendir(DIR, $dir) or die "cannot open directory $dir";
my @docs = grep(/-\d\d\.txt$/,readdir(DIR));
my %dates =();
my %intervals = ();
my %pairs = ();
my %files = @docs;
foreach my $file (@docs) {
	my ($pair, $coin, $curr, $int, $month, $day, $date) = '';
	if ($file =~ m!(\w{3,4})_(\w{3,4})_(\d{1,2}\w{1,})_(\d\d)-(\d\d)!) {
		$coin = $1;
		$curr = $2;
		$int = $3;
		$month = $4;
		$day = $5;
		$pair = $coin.'_'.$curr;
		$date = $month.'-'.$day;
		$pairs{$pair} = 1;
		$dates{$date} = 1;
	}
}
my @sorted_dates = sort(keys %dates);

my @intervals = qw(1m 5m 15m 30m);

open(OUT, "> $outfile") || die "Can't open $outfile Code: $!";
foreach my $pair (sort keys %pairs) {
#	print "$pair\n";
	foreach my $int (@intervals) {
		print OUT "$pair,mfi,$int,\n";
		print OUT "$pair,bb,$int,\n";
		print OUT "$pair,macd,$int,\n";
	}
}
close(OUT);
exit(0);

#first file  creation
open(OUT, "> $outfile") || die "Can't open $outfile Code: $!";
foreach my $pair (sort keys %pairs) {
	foreach my $int (@intervals) {
		my $dt = '06-16';
		my $infile = $pair.'_'.$int.'_'.$dt.'.txt';
		if (exists($files{$infile})) {
			open(IN, "< $dir$infile") || die "Can't open $dir$infile! Code: $!";
#			print "$pair,,,$dt,$dt\n";
			while (my $line=<IN>) {
#				if ($line =~ m!Data is OK!) {
#					print "Data is OK\t$infile\n";
					if ($line =~ m!^Optimum for mfi: (\d{1,}) ([\d.]{1,})!) {
						print "$pair,mfi,$int,$1,$2\n";
					}
					if ($line =~ m!^Optimum for bb: ([\d.,]{1,}) ([\d.]{1,})$!) {
						print "$pair,bb,$int,$1,$2\n";
					}
					if ($line =~ m!^Optimum for macd: ([\d.,]{1,}) ([\d.]{1,})$!) {
						print "$pair,macd,$int,$1,$2\n";
					}
#				}
#				else {
#					print "$pair,mfi,$int,,,\n";
#					print "$pair,bb,$int,,,\n";
#					print "$pair,macd,$int,,,\n";
#				}
			}
			close(IN);
		}
		else {
#			print "$pair,,,$dt,$dt\n";
#			print "$pair,mfi,$int,,,\n";
#			print "$pair,bb,$int,,,\n";
#			print "$pair,macd,$int,,,\n";
		}
	}
}
close(OUT);
